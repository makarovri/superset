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

import { DASHBOARD_INFO_UPDATED } from '../actions/dashboardInfo';
import { SET_BOOTSTRAP_DATA } from '../actions/bootstrapData';

export default function dashboardStateReducer(state = {}, action) {
  switch (action.type) {
    case DASHBOARD_INFO_UPDATED:
      return {
        ...state,
        ...action.newInfo,
        // server-side compare last_modified_time in second level
        lastModifiedTime: Math.round(new Date().getTime() / 1000),
      };
    case SET_BOOTSTRAP_DATA:
      return {
        ...state,
        ...action.data.dashboardInfo,
        // set async api call data
      };
    default:
      return state;
  }
}
