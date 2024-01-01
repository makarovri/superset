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
from __future__ import annotations

import logging
from typing import Any, cast, TypedDict

import pandas as pd
from flask_babel import gettext as __

from superset import app, db, results_backend, results_backend_use_msgpack
from superset.commands.base import BaseCommand
from superset.errors import ErrorLevel, SupersetError, SupersetErrorType
from superset.exceptions import SupersetErrorException, SupersetSecurityException
from superset.models.sql_lab import Query
from superset.sql_parse import ParsedQuery
from superset.sqllab.limiting_factor import LimitingFactor
from superset.utils import core as utils, csv
from superset.views.utils import _deserialize_results_payload

config = app.config

logger = logging.getLogger(__name__)


def _get_query(client_id) -> Query:
    query = (
        db.session.query(Query).filter_by(client_id=client_id).one_or_none()
    )
    if query is None:
        raise SupersetErrorException(
            SupersetError(
                message=__(
                    "The query associated with these results could not be found. "
                    "You need to re-run the original query."
                ),
                error_type=SupersetErrorType.RESULTS_BACKEND_ERROR,
                level=ErrorLevel.ERROR,
            ),
            status=404,
        )

    try:
        query.raise_for_access()
    except SupersetSecurityException as ex:
        raise SupersetErrorException(
            SupersetError(
                message=__("Cannot access the query"),
                error_type=SupersetErrorType.QUERY_SECURITY_ACCESS_ERROR,
                level=ErrorLevel.ERROR,
            ),
            status=403,
        ) from ex

    return query

def _get_query_df(query):
    blob = None
    if results_backend and query.results_key:
        logger.info(
            "Fetching data from results backend [%s]", query.results_key
        )
        blob = results_backend.get(query.results_key)
    if blob:
        logger.info("Decompressing")
        payload = utils.zlib_decompress(
            blob, decode=not results_backend_use_msgpack
        )
        obj = _deserialize_results_payload(
            payload, query, cast(bool, results_backend_use_msgpack)
        )

        df = pd.DataFrame(
            data=obj["data"],
            dtype=object,
            columns=[c["name"] for c in obj["columns"]],
        )

    else:
        logger.info("Running query for export")
        if query.select_sql:
            sql = query.select_sql
            limit = None
        else:
            sql = query.executed_sql
            limit = ParsedQuery(sql).limit
        if limit is not None and query.limiting_factor in {
            LimitingFactor.QUERY,
            LimitingFactor.DROPDOWN,
            LimitingFactor.QUERY_AND_DROPDOWN,
        }:
            # remove extra row from `increased_limit`
            limit -= 1
        df = query.database.get_df(sql, query.schema)[:limit]

    return df


class SqlPandasExportResult(TypedDict):
    query: Query
    data: pd.DataFrame


class SqlResultPandasExportCommand(BaseCommand):
    _client_id: str
    _query: Query

    def __init__(
        self,
        client_id: str,
    ) -> None:
        self._client_id = client_id

    def validate(self) -> None:
        self._query = _get_query(self._client_id)

    def run(
        self,
    ):
        self.validate()
        return {
                'query': self._query,
                'data': _get_query_df(self._query),
        }



class SqlCsvExportResult(TypedDict):
    query: Query
    count: int
    data: list[Any]


class SqlResultCsvExportCommand(BaseCommand):
    _client_id: str
    _query: Query

    def __init__(
        self,
        client_id: str,
    ) -> None:
        self._client_id = client_id

    def validate(self) -> None:
        self._query = _get_query(self._client_id)

    def run(
        self,
    ) -> SqlCsvExportResult:
        self.validate()
        df = _get_query_df(self._query)
        logger.info("Using pandas to convert to CSV")
        csv_data = csv.df_to_escaped_csv(df, index=False, **config["CSV_EXPORT"])

        return {
            "query": self._query,
            "count": len(df.index),
            "data": csv_data,
        }
