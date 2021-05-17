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
from flask_appbuilder.security.sqla.models import User
from unittest.mock import patch

from superset.views.log.views import LogModelView

from .base_tests import SupersetTestCase


class TestLogModelView(SupersetTestCase):
    def test_disabled(self):
        with patch.object(LogModelView, "is_enabled", return_value=False):
            self.login("admin")
            uri = "/logmodelview/list/"
            rv = self.client.get(uri)
            self.assert404(rv)

    def test_enabled(self):
        with patch.object(LogModelView, "is_enabled", return_value=True):
            self.login("admin")
            uri = "/logmodelview/list/"
            rv = self.client.get(uri)
            self.assert200(rv)
