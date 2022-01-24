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
from abc import ABC

from flask import g, request, Response
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
from superset.exceptions import InvalidPayloadFormatError
from superset.explore.form_data.commands.create import CreateFormDataCommand
from superset.explore.form_data.commands.delete import DeleteFormDataCommand
from superset.explore.form_data.commands.get import GetFormDataCommand
from superset.explore.form_data.commands.parameters import CommandParameters
from superset.explore.form_data.commands.update import UpdateFormDataCommand
from superset.explore.form_data.schemas import FormDataPostSchema, FormDataPutSchema
from superset.extensions import event_logger
from superset.key_value.commands.exceptions import KeyValueAccessDeniedError

logger = logging.getLogger(__name__)


class ExploreFormDataRestApi(BaseApi, ABC):
    add_model_schema = FormDataPostSchema()
    edit_model_schema = FormDataPutSchema()
    method_permission_name = MODEL_API_RW_METHOD_PERMISSION_MAP
    include_route_methods = {
        RouteMethod.POST,
        RouteMethod.PUT,
        RouteMethod.GET,
        RouteMethod.DELETE,
    }
    allow_browser_login = True
    class_permission_name = "ExploreFormDataRestApi"
    resource_name = "explore"
    openapi_spec_tag = "Explore Form Data"
    openapi_spec_component_schemas = (FormDataPostSchema, FormDataPutSchema)

    @expose("/form_data", methods=["POST"])
    @protect()
    @safe
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.post",
        log_to_statsd=False,
    )
    def post(self) -> Response:
        """Stores a new value.
        ---
        post:
          description: >-
            Stores a new value.
          requestBody:
            required: true
            content:
              application/json:
                schema:
                  $ref: '#/components/schemas/FormDataPostSchema'
          responses:
            201:
              description: The value was stored successfully.
              content:
                application/json:
                  schema:
                    type: object
                    properties:
                      key:
                        type: string
                        description: The key to retrieve the value.
            400:
              $ref: '#/components/responses/400'
            401:
              $ref: '#/components/responses/401'
            422:
              $ref: '#/components/responses/422'
            500:
              $ref: '#/components/responses/500'
        """
        if not request.is_json:
            raise InvalidPayloadFormatError("Request is not JSON")
        try:
            item = self.add_model_schema.load(request.json)
            args = CommandParameters(
                actor=g.user,
                dataset_id=item["dataset_id"],
                chart_id=item.get("dataset_id"),
                value=item["value"],
            )
            key = CreateFormDataCommand(args).run()
            return self.response(201, key=key)
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

    @expose("/form_data/<string:key>", methods=["PUT"])
    @protect()
    @safe
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.put",
        log_to_statsd=False,
    )
    def put(self, key: str) -> Response:
        """Updates an existing value.
        ---
        put:
          description: >-
            Updates an existing value.
          parameters:
          - in: path
            schema:
              type: string
            name: key
          requestBody:
            required: true
            content:
              application/json:
                schema:
                  $ref: '#/components/schemas/FormDataPutSchema'
          responses:
            200:
              description: The value was stored successfully.
              content:
                application/json:
                  schema:
                    type: object
                    properties:
                      message:
                        type: string
                        description: The result of the operation
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
        if not request.is_json:
            raise InvalidPayloadFormatError("Request is not JSON")
        try:
            item = self.edit_model_schema.load(request.json)
            args = CommandParameters(
                actor=g.user,
                dataset_id=item["dataset_id"],
                chart_id=item.get("dataset_id"),
                key=key,
                value=item["value"],
            )
            result = UpdateFormDataCommand(args).run()
            if not result:
                return self.response_404()
            return self.response(200, message="Value updated successfully.")
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

    @expose("/form_data/<string:key>", methods=["GET"])
    @protect()
    @safe
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.get",
        log_to_statsd=False,
    )
    def get(self, key: str) -> Response:
        """Retrives a value.
        ---
        get:
          description: >-
            Retrives a value.
          parameters:
          - in: path
            schema:
              type: string
            name: key
          responses:
            200:
              description: Returns the stored value.
              content:
                application/json:
                  schema:
                    type: object
                    properties:
                      value:
                        type: string
                        description: The stored value
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
            args = CommandParameters(actor=g.user, key=key)
            value = GetFormDataCommand(args).run()
            if not value:
                return self.response_404()
            return self.response(200, value=value)
        except (
            ChartAccessDeniedError,
            DatasetAccessDeniedError,
            KeyValueAccessDeniedError,
        ) as ex:
            return self.response(403, message=str(ex))
        except (ChartNotFoundError, DatasetNotFoundError) as ex:
            return self.response(404, message=str(ex))

    @expose("/form_data/<string:key>", methods=["DELETE"])
    @protect()
    @safe
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.delete",
        log_to_statsd=False,
    )
    def delete(self, key: str) -> Response:
        """Deletes a value.
        ---
        delete:
          description: >-
            Deletes a value.
          parameters:
          - in: path
            schema:
              type: string
            name: key
            description: The value key.
          responses:
            200:
              description: Deleted the stored value.
              content:
                application/json:
                  schema:
                    type: object
                    properties:
                      message:
                        type: string
                        description: The result of the operation
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
            args = CommandParameters(actor=g.user, key=key)
            result = DeleteFormDataCommand(args).run()
            if not result:
                return self.response_404()
            return self.response(200, message="Deleted successfully")
        except (
            ChartAccessDeniedError,
            DatasetAccessDeniedError,
            KeyValueAccessDeniedError,
        ) as ex:
            return self.response(403, message=str(ex))
        except (ChartNotFoundError, DatasetNotFoundError) as ex:
            return self.response(404, message=str(ex))
