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
from datetime import datetime
from functools import partial
from typing import Any, Optional, Union
from uuid import UUID

from superset import db
from superset.commands.base import BaseCommand
from superset.key_value.exceptions import KeyValueUpdateFailedError
from superset.key_value.models import KeyValueEntry
from superset.key_value.types import Key, KeyValueCodec, KeyValueResource
from superset.key_value.utils import get_filter
from superset.utils.core import get_user_id
from superset.utils.decorators import on_error, transaction

logger = logging.getLogger(__name__)


class UpdateKeyValueCommand(BaseCommand):
    resource: KeyValueResource
    value: Any
    codec: KeyValueCodec
    key: Union[int, UUID]
    expires_on: Optional[datetime]

    def __init__(  # pylint: disable=too-many-arguments
        self,
        resource: KeyValueResource,
        key: Union[int, UUID],
        value: Any,
        codec: KeyValueCodec,
        expires_on: Optional[datetime] = None,
    ):
        """
        Update a key value entry

        :param resource: the resource (dashboard, chart etc)
        :param key: the key to update
        :param value: the value to persist in the key-value store
        :param codec: codec used to encode the value
        :param expires_on: entry expiration time
        :return: the key associated with the updated value
        """
        self.resource = resource
        self.key = key
        self.value = value
        self.codec = codec
        self.expires_on = expires_on

    @transaction(on_error=partial(on_error, reraise=KeyValueUpdateFailedError))
    def run(self) -> Optional[Key]:
        return self.update()

    def validate(self) -> None:
        pass

    def update(self) -> Optional[Key]:
        filter_ = get_filter(self.resource, self.key)
        entry: KeyValueEntry = (
            db.session.query(KeyValueEntry).filter_by(**filter_).first()
        )
        if entry:
            entry.value = self.codec.encode(self.value)
            entry.expires_on = self.expires_on
            entry.changed_on = datetime.now()
            entry.changed_by_fk = get_user_id()
            return Key(id=entry.id, uuid=entry.uuid)

        return None
