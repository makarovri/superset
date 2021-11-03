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
"""add_key_value_table

Revision ID: 9b1945212fec
Revises: b92d69a6643c
Create Date: 2021-10-29 10:14:37.486812

"""

# revision identifiers, used by Alembic.
revision = '9b1945212fec'
down_revision = 'b92d69a6643c'

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy_utils import UUIDType

def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        'key_value',
        sa.Column('key', UUIDType(), nullable=False),
        sa.Column('value', sa.Text(), nullable=False),
        sa.Column("created_by_fk", sa.Integer(), nullable=False),
        sa.Column("created_on", sa.DateTime(), nullable=False),
        sa.Column("duration", sa.Integer(), nullable=True),
        sa.Column("reset_duration_on_retrieval", sa.Boolean(), nullable=False),
        sa.Column("retrieved_on", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('key'),
        sa.ForeignKeyConstraint(["created_by_fk"], ["ab_user.id"]),
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('key_value')
    # ### end Alembic commands ###
