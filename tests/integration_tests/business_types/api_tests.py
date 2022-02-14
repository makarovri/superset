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
# isort:skip_file
"""Unit tests for Superset"""
import json
import prison
from sqlalchemy import null

from superset.connectors.sqla.models import SqlaTable
from superset.utils.core import get_example_default_schema

from tests.integration_tests.base_tests import SupersetTestCase
from tests.integration_tests.test_app import app
from tests.integration_tests.utils.get_dashboards import get_dashboards_ids
from unittest import mock
from sqlalchemy import Column
from typing import Any, List
from superset.business_type.business_type import BusinessType
from superset.business_type.business_type_request import BusinessTypeRequest
from superset.business_type.business_type_response import BusinessTypeResponse
from superset.utils.core import FilterOperator, FilterStringOperators


target_resp: BusinessTypeResponse = {
    "values": [],
    "error_message": "",
    "display_value": "",
    "valid_filter_operators": [
        FilterStringOperators.EQUALS,
        FilterStringOperators.GREATER_THAN_OR_EQUAL,
        FilterStringOperators.GREATER_THAN,
        FilterStringOperators.IN,
        FilterStringOperators.LESS_THAN,
        FilterStringOperators.LESS_THAN_OR_EQUAL,
    ],
}


def translation_func(req: BusinessTypeRequest) -> BusinessTypeResponse:
    return target_resp


def translate_filter_func(col: Column, op: FilterOperator, values: List[Any]):
    pass


test_type: BusinessType = BusinessType(
    verbose_name="type",
    valid_data_types=["int"],
    translate_type=translation_func,
    description="",
    translate_filter=translate_filter_func,
)

CHART_DATA_URI = "api/v1/chart/business_type"
CHARTS_FIXTURE_COUNT = 10


class TestBusinessTypeApi(SupersetTestCase):
    """
    Test the Business Type API to ensure it works as intended
    """
    resource_name = "business_type"

    @mock.patch(
        "superset.business_type.api.BUSINESS_TYPE_ADDONS",
        {"type": 1},
    )
    def test_types_type_request(self):
        """
        Business Type API: Test to see if the API call returns all the valid business types
        """
        self.login(username="admin")
        uri = f"api/v1/business_type/types"
        response_value = self.client.get(uri)
        data = json.loads(response_value.data.decode("utf-8"))
        assert response_value.status_code == 200
        assert data == {"result": ["type"]}

    def test_types_convert_bad_request_no_vals(self):
        """
        Business Type API: Test request to see if it behaves as expected when no values are passed
        """
        self.login(username="admin")
        arguments = {"type": "type", "values": []}
        uri = f"api/v1/business_type/convert?q={prison.dumps(arguments)}"
        response_value = self.client.get(uri)
        assert response_value.status_code == 400

    def test_types_convert_bad_request_no_type(self):
        """
        Business Type API: Test request to see if it behaves as expected when no type is passed
        """
        self.login(username="admin")
        arguments = {"type": "", "values": [1]}
        uri = f"api/v1/business_type/convert?q={prison.dumps(arguments)}"
        response_value = self.client.get(uri)
        assert response_value.status_code == 400

    @mock.patch(
        "superset.business_type.api.BUSINESS_TYPE_ADDONS",
        {"type": 1},
    )
    def test_types_convert_bad_request_type_not_found(self):
        """
        Business Type API: Test request to see if it behaves as expected when passed in type is
        not found/not valid
        """
        self.login(username="admin")
        arguments = {"type": "not_found", "values": [1]}
        uri = f"api/v1/business_type/convert?q={prison.dumps(arguments)}"
        response_value = self.client.get(uri)
        assert response_value.status_code == 400

    @mock.patch(
        "superset.business_type.api.BUSINESS_TYPE_ADDONS",
        {"type": test_type},
    )
    def test_types_convert_request(self):
        """
        Business Type API: Test request to see if it behaves as expected when a valid type
        and valid values are passed in
        """
        self.login(username="admin")
        arguments = {"type": "type", "values": [1]}
        uri = f"api/v1/business_type/convert?q={prison.dumps(arguments)}"
        response_value = self.client.get(uri)
        assert response_value.status_code == 200
        data = json.loads(response_value.data.decode("utf-8"))
        assert data == {"result": target_resp}
