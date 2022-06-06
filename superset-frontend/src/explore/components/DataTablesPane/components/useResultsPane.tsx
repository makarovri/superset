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
import React, { useState, useEffect } from 'react';
import { ensureIsArray, styled, t } from '@superset-ui/core';
import Loading from 'src/components/Loading';
import { EmptyStateMedium } from 'src/components/EmptyState';
import { getChartDataRequest } from 'src/components/Chart/chartAction';
import { getClientErrorObject } from 'src/utils/getClientErrorObject';
import { ResultsPaneProps, QueryResultInterface } from '../types';
import { SingleQueryResultPane } from './SingleQueryResultPane';

const Error = styled.pre`
  margin-top: ${({ theme }) => `${theme.gridUnit * 4}px`};
`;

const cache = new WeakSet();

const queryCountMap = {
  mixed_timeseries: 2,
};

const getQueryCount = (vizType: string): number => {
  if (vizType in queryCountMap) {
    return queryCountMap[vizType];
  }
  return 1;
};

export const useResultsPane = ({
  isRequest,
  queryFormData,
  queryForce,
  ownState,
  errorMessage,
  actions,
  dataSize = 50,
}: ResultsPaneProps): React.ReactElement[] => {
  const [resultResp, setResultResp] = useState<QueryResultInterface[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [responseError, setResponseError] = useState<string>('');
  const queryCount = getQueryCount(queryFormData.viz_type);

  useEffect(() => {
    // it's an invalid formData when gets a errorMessage
    if (errorMessage) return;
    if (isRequest && !cache.has(queryFormData)) {
      setIsLoading(true);
      getChartDataRequest({
        formData: queryFormData,
        force: queryForce,
        resultFormat: 'json',
        resultType: 'results',
        ownState,
      })
        .then(({ json }) => {
          setResultResp(ensureIsArray(json.result));
          setResponseError('');
          cache.add(queryFormData);
          if (queryForce && actions) {
            actions.setForceQuery(false);
          }
        })
        .catch(response => {
          getClientErrorObject(response).then(({ error, message }) => {
            setResponseError(error || message || t('Sorry, an error occurred'));
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [queryFormData, isRequest]);

  useEffect(() => {
    if (errorMessage) {
      setIsLoading(false);
    }
  }, [errorMessage]);

  if (isLoading) {
    return Array(queryCount).fill(<Loading />);
  }

  if (errorMessage) {
    const title = t('Run a query to display results');
    return Array(queryCount).fill(
      <EmptyStateMedium image="document.svg" title={title} />,
    );
  }

  if (responseError) {
    return Array(queryCount).fill(<Error>{responseError}</Error>);
  }

  if (resultResp.length === 0) {
    const title = t('No results were returned for this query');
    return Array(queryCount).fill(
      <EmptyStateMedium image="document.svg" title={title} />,
    );
  }

  return resultResp.map((result, idx) => (
    <SingleQueryResultPane
      data={result.data}
      colnames={result.colnames}
      coltypes={result.coltypes}
      dataSize={dataSize}
      datasourceId={queryFormData.datasource}
      key={idx}
    />
  ));
};
