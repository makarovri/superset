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
import logging

from flask import current_app, g, request, Response
from flask_appbuilder.api import BaseApi, expose, protect, safe
from marshmallow import ValidationError

from superset.charts.commands.exceptions import (
    ChartAccessDeniedError,
    ChartNotFoundError,
)
from superset.constants import MODEL_API_RW_METHOD_PERMISSION_MAP, RouteMethod
from superset.datasets.commands.exceptions import (
    DatasetAccessDeniedError,
    DatasetNotFoundError,
)
from superset.explore.permalink.commands.create import CreateExplorePermalinkCommand
from superset.explore.permalink.commands.get import GetExplorePermalinkCommand
from superset.explore.permalink.exceptions import ExplorePermalinkInvalidStateError
from superset.explore.permalink.schemas import (
    ExplorePermalinkPostSchema,
    ExplorePermalinkPutSchema,
)
from superset.extensions import event_logger
from superset.key_value.exceptions import KeyValueAccessDeniedError
from superset.views.base_api import requires_json

logger = logging.getLogger(__name__)


class ExplorePermalinkRestApi(BaseApi):
    add_model_schema = ExplorePermalinkPostSchema()
    edit_model_schema = ExplorePermalinkPutSchema()
    method_permission_name = MODEL_API_RW_METHOD_PERMISSION_MAP
    include_route_methods = {
        RouteMethod.POST,
        RouteMethod.PUT,
        RouteMethod.GET,
        RouteMethod.DELETE,
    }
    allow_browser_login = True
    class_permission_name = "ExplorePermalinkRestApi"
    resource_name = "explore"
    openapi_spec_tag = "Explore Permanent Link"
    openapi_spec_component_schemas = (
        ExplorePermalinkPostSchema,
        ExplorePermalinkPutSchema,
    )

    @expose("/permalink", methods=["POST"])
    @protect()
    @safe
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.post",
        log_to_statsd=False,
    )
    @requires_json
    def post(self) -> Response:
        """Stores a new permanent link.
        ---
        post:
          description: >-
            Stores a new permanent link.
          requestBody:
            required: true
            content:
              application/json:
                schema:
                  $ref: '#/components/schemas/ExplorePermalinkPostSchema'
          responses:
            201:
              description: The permanent link was stored successfully.
              content:
                application/json:
                  schema:
                    type: object
                    properties:
                      key:
                        type: string
                        description: The key to retrieve the permanent link data.
            400:
              $ref: '#/components/responses/400'
            401:
              $ref: '#/components/responses/401'
            422:
              $ref: '#/components/responses/422'
            500:
              $ref: '#/components/responses/500'
        """
        key_type = current_app.config["PERMALINK_KEY_TYPE"]
        try:
            item = self.add_model_schema.load(request.json)
            chart_id = item.get("chart_id")
            dataset_id = item.get("dataset_id")
            state = item.get("state")
            key = CreateExplorePermalinkCommand(
                actor=g.user,
                chart_id=chart_id,
                dataset_id=dataset_id,
                state=state,
                key_type=key_type,
            ).run()
            http_origin = request.headers.environ["HTTP_ORIGIN"]
            url = f"{http_origin}/superset/explore/p/{key}/"
            return self.response(201, key=key, url=url)
        except ValidationError as ex:
            return self.response(400, message=ex.messages)
        except (
            ChartAccessDeniedError,
            DatasetAccessDeniedError,
            KeyValueAccessDeniedError,
        ) as ex:
            return self.response(403, message=str(ex))
        except (ChartNotFoundError, DatasetNotFoundError) as ex:
            return self.response(404, message=str(ex))

    @expose("/permalink/<string:key>", methods=["GET"])
    @protect()
    @safe
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.get",
        log_to_statsd=False,
    )
    def get(self, key: str) -> Response:
        """Retrives permanent link state for chart.
        ---
        get:
          description: >-
            Retrives chart state associated with a permanent link.
          parameters:
          - in: path
            schema:
              type: string
            name: key
          responses:
            200:
              description: Returns the stored form_data.
              content:
                application/json:
                  schema:
                    type: object
                    properties:
                      state:
                        type: object
                        description: The stored state
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
        try:
            key_type = current_app.config["PERMALINK_KEY_TYPE"]
            state = GetExplorePermalinkCommand(g.user, key, key_type).run()
            if not state:
                return self.response_404()
            return self.response(200, state=state)
        except ExplorePermalinkInvalidStateError as ex:
            return self.response(400, message=str(ex))
        except (ChartAccessDeniedError, DatasetAccessDeniedError,) as ex:
            return self.response(403, message=str(ex))
        except (ChartNotFoundError, DatasetNotFoundError) as ex:
            return self.response(404, message=str(ex))
