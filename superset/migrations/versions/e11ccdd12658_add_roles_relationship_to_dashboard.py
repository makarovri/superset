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
"""add roles relationship to dashboard

Revision ID: e11ccdd12658
Revises: 260bf0649a77
Create Date: 2021-01-14 19:12:43.406230
"""
# revision identifiers, used by Alembic.
revision = "e11ccdd12658"
down_revision = "260bf0649a77"

from alembic import op

from superset.migrations.shared.common import create_dashboard_roles_table


def upgrade():
    create_dashboard_roles_table()


def downgrade():
    op.drop_table("dashboard_roles")
