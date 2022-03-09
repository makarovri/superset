/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * 'License'); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { JsonObject, QueryFormData, SupersetClient } from '@superset-ui/core';
import rison from 'rison';
import { getClientErrorObject } from './getClientErrorObject';
import { URL_PARAMS } from '../constants';

export type UrlParamType = 'string' | 'number' | 'boolean' | 'object' | 'rison';
export type UrlParam = typeof URL_PARAMS[keyof typeof URL_PARAMS];
export function getUrlParam(param: UrlParam & { type: 'string' }): string;
export function getUrlParam(param: UrlParam & { type: 'number' }): number;
export function getUrlParam(param: UrlParam & { type: 'boolean' }): boolean;
export function getUrlParam(param: UrlParam & { type: 'object' }): object;
export function getUrlParam(param: UrlParam & { type: 'rison' }): object;
export function getUrlParam(
  param: UrlParam & { type: 'rison | string' },
): string | object;
export function getUrlParam({ name, type }: UrlParam): unknown {
  const urlParam = new URLSearchParams(window.location.search).get(name);
  switch (type) {
    case 'number':
      if (!urlParam) {
        return null;
      }
      if (urlParam === 'true') {
        return 1;
      }
      if (urlParam === 'false') {
        return 0;
      }
      if (!Number.isNaN(Number(urlParam))) {
        return Number(urlParam);
      }
      return null;
    case 'object':
      if (!urlParam) {
        return null;
      }
      return JSON.parse(urlParam);
    case 'boolean':
      if (!urlParam) {
        return null;
      }
      return urlParam !== 'false' && urlParam !== '0';
    case 'rison':
      if (!urlParam) {
        return null;
      }
      try {
        return rison.decode(urlParam);
      } catch {
        return urlParam;
      }
    default:
      return urlParam;
  }
}

function getPermalink(endpoint, jsonPayload) {
  return SupersetClient.post({
    endpoint,
    jsonPayload,
  })
    .then(result => result.json.url as string)
    .catch(response =>
      // @ts-ignore
      getClientErrorObject(response).then(({ error, statusText }) =>
        Promise.reject(error || statusText),
      ),
    );
}

export function getChartPermalink(chartId: number, formData: QueryFormData) {
  return getPermalink('/api/v1/explore/permalink', {
    chart_id: chartId,
    dataset_id: Number(formData.datasource.split('__')[0]),
    state: { form_data: formData },
  });
}

export function getDashboardPermalink(
  dashboardId: string,
  filterState: JsonObject,
) {
  return getPermalink('/api/v1/dashboard/permalink', {
    id_or_slug: dashboardId,
    state: { filter_state: filterState },
  });
}
