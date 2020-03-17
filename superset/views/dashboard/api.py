# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
import json
import logging
import re
from typing import Dict, List, Optional

from flask import current_app, g, make_response, Response
from flask_appbuilder.api import expose, protect, rison, safe
from flask_appbuilder.models.sqla.interface import SQLAInterface
from flask_babel import lazy_gettext as _, ngettext
from marshmallow import fields, post_load, pre_load, Schema, ValidationError
from marshmallow.validate import Length
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.wsgi import FileWrapper

from superset import is_feature_enabled, thumbnail_cache
from superset.constants import RouteMethod
from superset.exceptions import SupersetException, SupersetSecurityException
from superset.models.dashboard import Dashboard
from superset.tasks.thumbnails import cache_dashboard_thumbnail
from superset.utils import core as utils
from superset.utils.selenium import DashboardScreenshot
from superset.views.base import check_ownership, generate_download_headers
from superset.views.base_api import BaseOwnedModelRestApi
from superset.views.base_schemas import BaseOwnedSchema, validate_owner

from .mixin import DashboardMixin

logger = logging.getLogger(__name__)

bulk_delete_query_schema = {"type": "array", "items": {"type": "integer"}}
thumbnail_query_schema = {
    "type": "object",
    "properties": {"force": {"type": "boolean"}},
}
export_query_schema = {"type": "array", "items": {"type": "integer"}}


class DashboardJSONMetadataSchema(Schema):
    timed_refresh_immune_slices = fields.List(fields.Integer())
    filter_scopes = fields.Dict()
    expanded_slices = fields.Dict()
    refresh_frequency = fields.Integer()
    default_filters = fields.Str()
    stagger_refresh = fields.Boolean()
    stagger_time = fields.Integer()
    color_scheme = fields.Str()
    label_colors = fields.Dict()


def validate_json(value):
    try:
        utils.validate_json(value)
    except SupersetException:
        raise ValidationError("JSON not valid")


def validate_json_metadata(value):
    if not value:
        return
    try:
        value_obj = json.loads(value)
    except json.decoder.JSONDecodeError:
        raise ValidationError("JSON not valid")
    errors = DashboardJSONMetadataSchema(strict=True).validate(value_obj, partial=False)
    if errors:
        raise ValidationError(errors)


def validate_slug_uniqueness(value):
    # slug is not required but must be unique
    if value:
        item = (
            current_app.appbuilder.get_session.query(Dashboard.id)
            .filter_by(slug=value)
            .one_or_none()
        )
        if item:
            raise ValidationError("Must be unique")


class BaseDashboardSchema(BaseOwnedSchema):
    @pre_load
    def pre_load(self, data):  # pylint: disable=no-self-use
        super().pre_load(data)
        if data.get("slug"):
            data["slug"] = data["slug"].strip()
            data["slug"] = data["slug"].replace(" ", "-")
            data["slug"] = re.sub(r"[^\w\-]+", "", data["slug"])
        if "owners" in data and data["owners"] is None:
            data["owners"] = []


class DashboardPostSchema(BaseDashboardSchema):
    __class_model__ = Dashboard

    dashboard_title = fields.String(allow_none=True, validate=Length(0, 500))
    slug = fields.String(
        allow_none=True, validate=[Length(1, 255), validate_slug_uniqueness]
    )
    owners = fields.List(fields.Integer(validate=validate_owner))
    position_json = fields.String(validate=validate_json)
    css = fields.String()
    json_metadata = fields.String(validate=validate_json_metadata)
    published = fields.Boolean()


class DashboardPutSchema(BaseDashboardSchema):
    dashboard_title = fields.String(allow_none=True, validate=Length(0, 500))
    slug = fields.String(allow_none=True, validate=Length(0, 255))
    owners = fields.List(fields.Integer(validate=validate_owner))
    position_json = fields.String(validate=validate_json)
    css = fields.String()
    json_metadata = fields.String(validate=validate_json_metadata)
    published = fields.Boolean()

    @post_load
    def make_object(self, data: Dict, discard: Optional[List[str]] = None) -> Dashboard:
        self.instance = super().make_object(data, [])
        for slc in self.instance.slices:
            slc.owners = list(set(self.instance.owners) | set(slc.owners))
        return self.instance


class DashboardRestApi(DashboardMixin, BaseOwnedModelRestApi):
    datamodel = SQLAInterface(Dashboard)
    include_route_methods = RouteMethod.REST_MODEL_VIEW_CRUD_SET | {
        RouteMethod.EXPORT,
        RouteMethod.RELATED,
        "bulk_delete",  # not using RouteMethod since locally defined
    }
    resource_name = "dashboard"
    allow_browser_login = True

    class_permission_name = "DashboardModelView"
    show_columns = [
        "charts",
        "css",
        "dashboard_title",
        "json_metadata",
        "owners.id",
        "owners.username",
        "position_json",
        "published",
        "slug",
        "table_names",
    ]
    order_columns = ["dashboard_title", "changed_on", "published", "changed_by_fk"]
    list_columns = [
        "changed_by_name",
        "changed_by_url",
        "changed_by.username",
        "changed_on",
        "dashboard_title",
        "id",
        "published",
        "slug",
        "url",
        "thumbnail_url",
    ]

    add_model_schema = DashboardPostSchema()
    edit_model_schema = DashboardPutSchema()

    order_rel_fields = {
        "slices": ("slice_name", "asc"),
        "owners": ("first_name", "asc"),
    }
    filter_rel_fields_field = {"owners": "first_name"}
    allowed_rel_fields = {"owners"}

    def __init__(self, *args, **kwargs):
        if is_feature_enabled("THUMBNAILS"):
            self.include_route_methods = self.include_route_methods | {"thumbnail"}
        super().__init__(*args, **kwargs)

    @expose("/", methods=["DELETE"])
    @protect()
    @rison(bulk_delete_query_schema)
    @safe
    def bulk_delete(self, **kwargs):  # pylint: disable=arguments-differ
        """Delete bulk Dashboards
        ---
        delete:
          parameters:
          - in: query
            name: q
            content:
              application/json:
                schema:
                  type: array
                  items:
                    type: integer
          responses:
            200:
              description: Dashboard bulk delete
              content:
                application/json:
                  schema:
                    type: object
                    properties:
                      message:
                        type: string
            401:
              $ref: '#/components/responses/401'
            403:
              $ref: '#/components/responses/401'
            404:
              $ref: '#/components/responses/404'
            422:
              $ref: '#/components/responses/422'
            500:
              $ref: '#/components/responses/500'
        """
        item_ids = kwargs["rison"]
        query = self.datamodel.session.query(Dashboard).filter(
            Dashboard.id.in_(item_ids)
        )
        items = self._base_filters.apply_all(query).all()
        if not items:
            return self.response_404()
        # Check user ownership over the items
        for item in items:
            try:
                check_ownership(item)
            except SupersetSecurityException as e:
                logger.warning(
                    f"Dashboard {item} was not deleted, "
                    f"because the user ({g.user}) does not own it"
                )
                return self.response(403, message=_("No dashboards deleted"))
            except SQLAlchemyError as e:
                logger.error(f"Error checking dashboard ownership {e}")
                return self.response_422(message=str(e))
        # bulk delete, first delete related data
        for item in items:
            try:
                item.slices = []
                item.owners = []
                self.datamodel.session.merge(item)
            except SQLAlchemyError as e:
                logger.error(f"Error bulk deleting related data on dashboards {e}")
                self.datamodel.session.rollback()
                return self.response_422(message=str(e))
        # bulk delete itself
        try:
            self.datamodel.session.query(Dashboard).filter(
                Dashboard.id.in_(item_ids)
            ).delete(synchronize_session="fetch")
        except SQLAlchemyError as e:
            logger.error(f"Error bulk deleting dashboards {e}")
            self.datamodel.session.rollback()
            return self.response_422(message=str(e))
        self.datamodel.session.commit()
        return self.response(
            200,
            message=ngettext(
                f"Deleted %(num)d dashboard",
                f"Deleted %(num)d dashboards",
                num=len(items),
            ),
        )

    @expose("/export/", methods=["GET"])
    @protect()
    @rison(export_query_schema)
    @safe
    def export(self, **kwargs):
        """Export dashboards
        ---
        get:
          parameters:
          - in: query
            name: q
            content:
              application/json:
                schema:
                  type: array
                  items:
                    type: integer
          responses:
            200:
              description: Dashboard export
              content:
                text/plain:
                  schema:
                    type: string
            400:
              $ref: '#/components/responses/400'
            401:
              $ref: '#/components/responses/401'
            404:
              $ref: '#/components/responses/404'
            422:
              $ref: '#/components/responses/422'
            500:
              $ref: '#/components/responses/500'
        """
        query = self.datamodel.session.query(Dashboard).filter(
            Dashboard.id.in_(kwargs["rison"])
        )
        query = self._base_filters.apply_all(query)
        ids = [item.id for item in query.all()]
        if not ids:
            return self.response_404()
        export = Dashboard.export_dashboards(ids)
        resp = make_response(export, 200)
        resp.headers["Content-Disposition"] = generate_download_headers("json")[
            "Content-Disposition"
        ]
        return resp

    @expose("/<pk>/thumbnail/<digest>/", methods=["GET"])
    @protect()
    @safe
    @rison(thumbnail_query_schema)
    def thumbnail(self, pk, digest, **kwargs):  # pylint: disable=invalid-name
        """Get Dashboard thumbnail
        ---
        get:
          description: >-
            Compute async or get already computed dashboard thumbnail from cache
          parameters:
          - in: path
            schema:
              type: integer
            name: pk
          - in: path
            name: digest
            description: A hex digest that makes this dashboard unique
            schema:
              type: string
          - in: query
            name: q
            content:
              application/json:
                schema:
                  type: object
                  properties:
                    force:
                      type: boolean
                      default: false
          responses:
            200:
              description: Dashboard thumbnail image
              content:
               image/*:
                 schema:
                   type: string
                   format: binary
            202:
              description: Thumbnail does not exist on cache, fired async to compute
              content:
                application/json:
                  schema:
                    type: object
                    properties:
                      message:
                        type: string
            401:
              $ref: '#/components/responses/401'
            404:
              $ref: '#/components/responses/404'
            422:
              $ref: '#/components/responses/422'
            500:
              $ref: '#/components/responses/500'
        """
        dashboard = self.datamodel.get(pk, self._base_filters)
        if not dashboard:
            return self.response_404()
        # If force, request a screenshot from the workers
        if kwargs["rison"].get("force", False):
            cache_dashboard_thumbnail.delay(dashboard.id, force=True)
            return self.response(202, message="OK Async")
        # fetch the dashboard screenshot using the current user and cache if set
        screenshot = DashboardScreenshot(pk).get_from_cache(cache=thumbnail_cache)
        # If the screenshot does not exist, request one from the workers
        if not screenshot:
            cache_dashboard_thumbnail.delay(dashboard.id, force=True)
            return self.response(202, message="OK Async")
        # If digests
        if dashboard.digest != digest:
            logger.info("Requested thumbnail digest differs from actual digest")
            return self.response(304, message="Digest differs")
        return Response(
            FileWrapper(screenshot), mimetype="image/png", direct_passthrough=True
        )
