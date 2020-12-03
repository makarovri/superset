/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { useParams, Link, useHistory } from 'react-router-dom';
import moment from 'moment';
import { styled, t, SupersetClient } from '@superset-ui/core';

import AlertStatusIcon from 'src/views/CRUD/alert/components/AlertStatusIcon';
import ListView from 'src/components/ListView';
import SubMenu from 'src/components/Menu/SubMenu';
import getClientErrorObject from 'src/utils/getClientErrorObject';
import withToasts from 'src/messageToasts/enhancers/withToasts';
import { fDuration } from 'src/modules/dates';
import { useListViewResource } from 'src/views/CRUD/hooks';

import { LogObject } from './types';

const PAGE_SIZE = 25;

interface ExecutionLogProps {
  addDangerToast: (msg: string) => void;
  addSuccessToast: (msg: string) => void;
  isReportEnabled: boolean;
}

function ExecutionLog({ addDangerToast, isReportEnabled }: ExecutionLogProps) {
  const { alertId }: any = useParams();
  const {
    state: { loading, resourceCount: LogCount, resourceCollection: logs },
    fetchData,
  } = useListViewResource<LogObject>(
    `report/${alertId}/log`,
    t('log'),
    addDangerToast,
    false,
  );
  const [alertName, setAlertName] = useState<string>('');
  const [executionLogType, setExecutionLogType] = useState<'Report' | 'Alert'>(
    'Report',
  );
  const StyledHeader = styled.div`
    display: flex;
    flex-direction: row;

    a,
    Link {
      margin-left: 16px;
      font-size: 12px;
      font-weight: normal;
      text-decoration: underline;
    }
  `;

  let hasHistory = true;

  try {
    useHistory();
  } catch (err) {
    // If error is thrown, we know not to use <Link> in render
    hasHistory = false;
  }

  const fetchAlert = useCallback(
    async function fetchAlert() {
      try {
        const response = await SupersetClient.get({
          endpoint: `/api/v1/report/${alertId}`,
        });
        setAlertName(response.json.result.name);
        setExecutionLogType(response.json.result.type);
      } catch (response) {
        await getClientErrorObject(response).then(({ message }: any) => {
          addDangerToast(message || t('Sorry, An error occurred'));
        });
      }
    },
    [alertId],
  );

  useEffect(() => {
    fetchAlert();
  }, [fetchAlert]);

  const initialSort = [{ id: 'start_dttm', desc: true }];
  const columns = useMemo(
    () => [
      {
        Cell: ({
          row: {
            original: { state },
          },
        }: any) => <AlertStatusIcon state={state} />,
        accessor: 'state',
        Header: t('State'),
        size: 'xs',
        disableSortBy: true,
      },
      {
        accessor: 'scheduled_dttm',
        Header: t('Scheduled at'),
      },
      {
        Cell: ({
          row: {
            original: { start_dttm: startDttm },
          },
        }: any) => moment(new Date(startDttm)).format('ll'),
        Header: t('Start At'),
        accessor: 'start_dttm',
      },
      {
        Cell: ({
          row: {
            original: { start_dttm: startDttm, end_dttm: endDttm },
          },
        }: any) => fDuration(endDttm - startDttm),
        Header: t('Duration'),
        disableSortBy: true,
      },
      {
        accessor: 'value',
        Header: t('Value'),
      },
      {
        accessor: 'error_message',
        Header: t('Error Message'),
      },
    ],
    [],
  );
  const path = `/${isReportEnabled ? 'report' : 'alert'}/list/`;
  return (
    <>
      <SubMenu
        name={
          <StyledHeader>
            <span>
              {t(`${executionLogType}`)} {alertName}
            </span>
            <span>
              {hasHistory ? (
                <Link to={path}>Back to all</Link>
              ) : (
                <a href={path}>Back to all</a>
              )}
            </span>
          </StyledHeader>
        }
      />
      <ListView<LogObject>
        className="execution-log-list-view"
        columns={columns}
        count={LogCount}
        data={logs}
        fetchData={fetchData}
        initialSort={initialSort}
        loading={loading}
        pageSize={PAGE_SIZE}
      />
    </>
  );
}

export default withToasts(ExecutionLog);
