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
import { SupersetError } from 'src/components/ErrorMessage/types';
import { CtasEnum } from 'src/SqlLab/actions/sqlLab';
import { UserWithPermissionsAndRoles } from 'src/types/bootstrapTypes';
import { ToastType } from 'src/components/MessageToasts/types';
import { DatasourceType } from '@superset-ui/core';

// same as superset.result_set.ResultSetColumnType
export type Column = {
  name: string;
  type: string | null;
  is_dttm: boolean;
};

export type QueryState =
  | 'stopped'
  | 'failed'
  | 'pending'
  | 'running'
  | 'scheduled'
  | 'success'
  | 'fetching'
  | 'timed_out';

export type Query = {
  cached: boolean;
  ctas: boolean;
  ctas_method?: keyof typeof CtasEnum;
  dbId: number;
  errors?: SupersetError[];
  errorMessage: string | null;
  extra: {
    progress: string | null;
  };
  id: string;
  isDataPreview: boolean;
  link?: string;
  progress: number;
  results: {
    displayLimitReached: boolean;
    columns: Column[];
    data: Record<string, unknown>[];
    expanded_columns: Column[];
    selected_columns: Column[];
    query: { limit: number };
  };
  resultsKey: string | null;
  schema?: string;
  sql: string;
  sqlEditorId: string;
  state: QueryState;
  tab: string | null;
  tempSchema: string | null;
  tempTable: string;
  trackingUrl: string | null;
  templateParams: any;
  rows: number;
  queryLimit: number;
  limitingFactor: string;
  endDttm: number;
  duration: string;
  startDttm: number;
  time: Record<string, any>;
  user: Record<string, any>;
  userId: number;
  db: Record<string, any>;
  started: string;
  querylink: Record<string, any>;
  queryId: number;
  executedSql: string;
  output: string | Record<string, any>;
  actions: Record<string, any>;
  type: DatasourceType.Query;
};

export interface QueryEditor {
  dbId?: number;
  title: string;
  schema: string;
  autorun: boolean;
  sql: string;
  remoteId: number | null;
  validationResult?: {
    completed: boolean;
    errors: SupersetError[];
  };
}

export type toastState = {
  id: string;
  toastType: ToastType;
  text: string;
  duration: number;
  noDuplicate: boolean;
};

export type SqlLabRootState = {
  sqlLab: {
    activeSouthPaneTab: string | number; // default is string; action.newQuery.id is number
    alerts: any[];
    databases: Record<string, any>;
    dbConnect: boolean;
    offline: boolean;
    queries: Query[];
    queryEditors: QueryEditor[];
    tabHistory: string[]; // default is activeTab ? [activeTab.id.toString()] : []
    tables: Record<string, any>[];
    queriesLastUpdate: number;
    user: UserWithPermissionsAndRoles;
    errorMessage: string | null;
  };
  localStorageUsageInKilobytes: number;
  messageToasts: toastState[];
  common: {};
};

export type ExploreRootState = {
  explore: {
    can_add: boolean;
    can_download: boolean;
    common: object;
    controls: object;
    controlsTransferred: object;
    datasource: object;
    datasource_id: number;
    datasource_type: string;
    force: boolean;
    forced_height: object;
    form_data: object;
    isDatasourceMetaLoading: boolean;
    isStarred: boolean;
    slice: object;
    sliceName: string;
    standalone: boolean;
    timeFormattedColumns: object;
    user: UserWithPermissionsAndRoles;
  };
  localStorageUsageInKilobytes: number;
  messageToasts: toastState[];
  common: {};
};

export type SqlLabExploreRootState = SqlLabRootState | ExploreRootState;

export const getInitialState = (state: SqlLabExploreRootState) => {
  if (state.hasOwnProperty('sqlLab')) {
    const {
      sqlLab: { user },
    } = state as SqlLabRootState;
    return user;
  }

  const {
    explore: { user },
  } = state as ExploreRootState;
  return user;
};

export enum DatasetRadioState {
  SAVE_NEW = 1,
  OVERWRITE_DATASET = 2,
}

export const EXPLORE_CHART_DEFAULT = {
  metrics: [],
  groupby: [],
  time_range: 'No filter',
  viz_type: 'table',
};

export interface DatasetOwner {
  first_name: string;
  id: number;
  last_name: string;
  username: string;
}

export interface DatasetOptionAutocomplete {
  value: string;
  datasetId: number;
  owners: [DatasetOwner];
}
