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
import sinon from 'sinon';
import fetchMock from 'fetch-mock';
import { Dispatch } from 'redux';
import { ADD_TOAST } from 'src/components/MessageToasts/actions';

import {
  createDashboard,
  createSlice,
  getSliceDashboards,
  SAVE_SLICE_FAILED,
  SAVE_SLICE_SUCCESS,
  updateSlice,
  getSlicePayload,
  Slice,
  FormData,
} from './saveModalActions';

// Define test constants and mock data using imported types
const sliceId = 10;
const sliceName = 'New chart';
const vizType = 'sample_viz_type';
const datasourceId = 11;
const datasourceType = 'sample_datasource_type';
const dashboards = [12, 13];
const queryContext = { sampleKey: 'sampleValue' };

const formData: FormData = {
  viz_type: vizType,
  datasource: `${datasourceId}__${datasourceType}`,
  dashboards,
};

const mockExploreState = { explore: { form_data: formData } };

const sliceResponsePayload: Slice = {
  slice_id: sliceId,
  owners: [],
  form_data: formData,
};

const sampleError = new Error('sampleError');

// Mocks
jest.mock('../exploreUtils', () => ({
  buildV1ChartDataPayload: jest.fn(() => queryContext),
}));

/**
 * Tests updateSlice action
 */
const updateSliceEndpoint = `glob:*/api/v1/chart/${sliceId}`;
test('updateSlice handles success', async () => {
  fetchMock.reset();
  fetchMock.put(updateSliceEndpoint, sliceResponsePayload);
  const dispatchSpy = sinon.spy();
  const dispatch = (action: any) => {
    dispatchSpy(action);
  };
  const getState = () => mockExploreState;

  const slice = await updateSlice(
    { slice_id: sliceId, owners: [], form_data: formData },
    sliceName,
    [],
  )(dispatch as Dispatch<any>, getState);

  expect(fetchMock.calls(updateSliceEndpoint)).toHaveLength(1);
  expect(dispatchSpy.callCount).toBe(2);
  expect(dispatchSpy.getCall(0).args[0].type).toBe(SAVE_SLICE_SUCCESS);
  expect(dispatchSpy.getCall(1).args[0].type).toBe('ADD_TOAST');
  expect(dispatchSpy.getCall(1).args[0].payload.toastType).toBe(
    'SUCCESS_TOAST',
  );
  expect(dispatchSpy.getCall(1).args[0].payload.text).toBe(
    'Chart [New chart] has been overwritten',
  );
  expect(slice).toEqual(sliceResponsePayload);
});

test('updateSlice handles failure', async () => {
  fetchMock.reset();
  fetchMock.put(updateSliceEndpoint, { throws: sampleError });

  const dispatchSpy = sinon.spy();
  const dispatch = (action: any) => {
    dispatchSpy(action);
  };

  const getState = () => mockExploreState;

  let caughtError;
  try {
    await updateSlice(
      { slice_id: sliceId, owners: [], form_data: formData },
      sliceName,
      [],
    )(dispatch as Dispatch<any>, getState);
  } catch (error) {
    caughtError = error;
  }

  expect(caughtError).toEqual(sampleError);
  expect(fetchMock.calls(updateSliceEndpoint)).toHaveLength(4);
  expect(dispatchSpy.callCount).toBe(1);
  expect(dispatchSpy.getCall(0).args[0].type).toBe(SAVE_SLICE_FAILED);
});

/**
 * Tests createSlice action
 */
const createSliceEndpoint = `glob:*/api/v1/chart/`;
test('createSlice handles success', async () => {
  fetchMock.reset();
  fetchMock.post(createSliceEndpoint, sliceResponsePayload);
  const dispatchSpy = sinon.spy();
  const dispatch = (action: any) => dispatchSpy(action);
  const getState = () => mockExploreState;
  const slice: Partial<Slice> = await createSlice(sliceName, [])(
    dispatch as Dispatch,
    getState,
  );
  expect(fetchMock.calls(createSliceEndpoint)).toHaveLength(1);
  expect(dispatchSpy.callCount).toBe(2);
  expect(dispatchSpy.getCall(0).args[0].type).toBe(SAVE_SLICE_SUCCESS);
  expect(dispatchSpy.getCall(1).args[0].type).toBe(ADD_TOAST);
  expect(dispatchSpy.getCall(1).args[0].payload.toastType).toBe(
    'SUCCESS_TOAST',
  );
  expect(dispatchSpy.getCall(1).args[0].payload.text).toBe(
    'Chart [New chart] has been saved',
  );

  expect(slice).toEqual(sliceResponsePayload);
});

test('createSlice handles failure', async () => {
  fetchMock.reset();
  fetchMock.post(createSliceEndpoint, { throws: sampleError });

  const dispatchSpy = sinon.spy();
  const dispatch = (action: any) => dispatchSpy(action);
  const getState = () => mockExploreState;

  let caughtError: Error | undefined;
  try {
    await createSlice(sliceName, [])(dispatch as Dispatch, getState);
  } catch (error) {
    caughtError = error;
  }

  expect(caughtError).toEqual(sampleError);
  expect(fetchMock.calls(createSliceEndpoint)).toHaveLength(4);
  expect(dispatchSpy.callCount).toBe(1);
  expect(dispatchSpy.getCall(0).args[0].type).toBe(SAVE_SLICE_FAILED);
});

const dashboardName = 'New dashboard';
const dashboardResponsePayload = {
  id: 14,
};

/**
 * Tests createDashboard action
 */

const createDashboardEndpoint = `glob:*/api/v1/dashboard/`;
test('createDashboard handles success', async () => {
  fetchMock.reset();
  fetchMock.post(createDashboardEndpoint, dashboardResponsePayload);
  const dispatch = sinon.spy();
  const dashboard = await createDashboard(dashboardName)(
    dispatch as Dispatch<any>,
  );
  expect(fetchMock.calls(createDashboardEndpoint)).toHaveLength(1);
  expect(dispatch.callCount).toBe(0);
  expect(dashboard).toEqual(dashboardResponsePayload);
});

test('createDashboard handles failure', async () => {
  fetchMock.reset();
  fetchMock.post(createDashboardEndpoint, { throws: sampleError });
  const dispatch = sinon.spy();
  let caughtError;
  try {
    await createDashboard(dashboardName)(dispatch as Dispatch<any>);
  } catch (error) {
    caughtError = error;
  }

  expect(caughtError).toEqual(sampleError);
  expect(fetchMock.calls(createDashboardEndpoint)).toHaveLength(4);
  expect(dispatch.callCount).toBe(1);
  expect(dispatch.getCall(0).args[0].type).toBe(SAVE_SLICE_FAILED);
});

test('updateSlice with add to new dashboard handles success', async () => {
  fetchMock.reset();
  fetchMock.put(updateSliceEndpoint, sliceResponsePayload);
  const dispatchSpy = sinon.spy();
  const dispatch = (action: any) => dispatchSpy(action);
  const getState = () => mockExploreState;

  const slice = await updateSlice(
    {
      slice_id: sliceId,
      owners: [],
      form_data: {
        datasource: '',
        viz_type: '',
        adhoc_filters: [],
        dashboards: [],
      },
    },
    sliceName,
    [],
    {
      new: true,
      title: dashboardName,
    },
  )(dispatch as Dispatch<any>, getState);

  expect(fetchMock.calls(updateSliceEndpoint)).toHaveLength(1);
  expect(dispatchSpy.callCount).toBe(3);
  expect(dispatchSpy.getCall(0).args[0].type).toBe(SAVE_SLICE_SUCCESS);
  expect(dispatchSpy.getCall(1).args[0].type).toBe(ADD_TOAST);
  expect(dispatchSpy.getCall(1).args[0].payload.toastType).toBe(
    'SUCCESS_TOAST',
  );
  expect(dispatchSpy.getCall(1).args[0].payload.text).toBe(
    'Chart [New chart] has been overwritten',
  );
  expect(dispatchSpy.getCall(2).args[0].type).toBe(ADD_TOAST);
  expect(dispatchSpy.getCall(2).args[0].payload.toastType).toBe(
    'SUCCESS_TOAST',
  );
  expect(dispatchSpy.getCall(2).args[0].payload.text).toBe(
    'Dashboard [New dashboard] just got created and chart [New chart] was added to it',
  );

  expect(slice).toEqual(sliceResponsePayload);
});

test('updateSlice with add to existing dashboard handles success', async () => {
  fetchMock.reset();
  fetchMock.put(updateSliceEndpoint, sliceResponsePayload);
  const dispatchSpy = sinon.spy();
  const dispatch = (action: any) => dispatchSpy(action);
  const getState = () => mockExploreState;
  const slice = await updateSlice(
    {
      slice_id: sliceId,
      owners: [],
      form_data: {
        datasource: '',
        viz_type: '',
        adhoc_filters: [],
        dashboards: [],
      },
    },
    sliceName,
    [],
    {
      new: false,
      title: dashboardName,
    },
  )(dispatch as Dispatch<any>, getState);

  expect(fetchMock.calls(updateSliceEndpoint)).toHaveLength(1);
  expect(dispatchSpy.callCount).toBe(3);
  expect(dispatchSpy.getCall(0).args[0].type).toBe(SAVE_SLICE_SUCCESS);
  expect(dispatchSpy.getCall(1).args[0].type).toBe(ADD_TOAST);
  expect(dispatchSpy.getCall(1).args[0].payload.toastType).toBe(
    'SUCCESS_TOAST',
  );
  expect(dispatchSpy.getCall(1).args[0].payload.text).toBe(
    'Chart [New chart] has been overwritten',
  );
  expect(dispatchSpy.getCall(2).args[0].type).toBe(ADD_TOAST);
  expect(dispatchSpy.getCall(2).args[0].payload.toastType).toBe(
    'SUCCESS_TOAST',
  );
  expect(dispatchSpy.getCall(2).args[0].payload.text).toBe(
    'Chart [New chart] was added to dashboard [New dashboard]',
  );

  expect(slice).toEqual(sliceResponsePayload);
});

const dashboardSlicesResponsePayload = {
  result: {
    dashboards: [{ id: 21 }, { id: 22 }, { id: 23 }],
  },
};
const getDashboardSlicesReturnValue = [21, 22, 23];
/**
 * Tests getSliceDashboards action
 */

const getSliceDashboardsEndpoint = `glob:*/api/v1/chart/${sliceId}?q=(columns:!(dashboards.id))`;
test('getSliceDashboards with slice handles success', async () => {
  fetchMock.reset();
  fetchMock.get(getSliceDashboardsEndpoint, dashboardSlicesResponsePayload);
  const dispatchSpy = sinon.spy();
  const dispatch = (action: any) => dispatchSpy(action);
  const sliceDashboards = await getSliceDashboards({
    slice_id: 10,
    owners: [],
    form_data: {
      datasource: '',
      viz_type: '',
      adhoc_filters: [],
      dashboards: [],
    },
  })(dispatch as Dispatch<any>);
  expect(fetchMock.calls(getSliceDashboardsEndpoint)).toHaveLength(1);
  expect(dispatchSpy.callCount).toBe(0);
  expect(sliceDashboards).toEqual(getDashboardSlicesReturnValue);
});

test('getSliceDashboards with slice handles failure', async () => {
  fetchMock.reset();
  fetchMock.get(getSliceDashboardsEndpoint, { throws: sampleError });
  const dispatch = sinon.spy();
  let caughtError;
  try {
    await getSliceDashboards({
      slice_id: sliceId,
      owners: [],
      form_data: {
        datasource: '',
        viz_type: '',
        adhoc_filters: [],
        dashboards: [],
      },
    })(dispatch as Dispatch<any>);
  } catch (error) {
    caughtError = error;
  }

  expect(caughtError).toEqual(sampleError);
  expect(fetchMock.calls(getSliceDashboardsEndpoint)).toHaveLength(4);
  expect(dispatch.callCount).toBe(1);
  expect(dispatch.getCall(0).args[0].type).toBe(SAVE_SLICE_FAILED);
});

describe('getSlicePayload', () => {
  const sliceName = 'Test Slice';
  const formDataWithNativeFilters = {
    datasource: '22__table',
    viz_type: 'pie',
    adhoc_filters: [],
  };
  const dashboards = [5];
  const owners = ['1'];
  const formDataFromSlice = {
    datasource: '22__table',
    viz_type: 'pie',
    adhoc_filters: [
      {
        clause: 'WHERE',
        subject: 'year',
        operator: 'TEMPORAL_RANGE',
        comparator: 'No filter',
        expressionType: 'SIMPLE',
      },
    ],
    dashboards: [],
  };

  test('should return the correct payload when no adhoc_filters are present in formDataWithNativeFilters', () => {
    const result = getSlicePayload(
      sliceName,
      formDataWithNativeFilters,
      dashboards,
      owners,
      formDataFromSlice,
    );
    expect(result).toHaveProperty('params');
    expect(result).toHaveProperty('slice_name', sliceName);
    expect(result).toHaveProperty(
      'viz_type',
      formDataWithNativeFilters.viz_type,
    );
    expect(result).toHaveProperty('datasource_id', 22);
    expect(result).toHaveProperty('datasource_type', 'table');
    expect(result).toHaveProperty('dashboards', dashboards);
    expect(result).toHaveProperty('owners', owners);
    expect(result).toHaveProperty('query_context');
    expect(JSON.parse(result.params).adhoc_filters).toEqual(
      formDataFromSlice.adhoc_filters,
    );
  });

  test('should return the correct payload when adhoc_filters are present in formDataWithNativeFilters', () => {
    const formDataWithAdhocFilters = {
      ...formDataWithNativeFilters,
      adhoc_filters: [
        {
          clause: 'WHERE',
          subject: 'year',
          operator: 'TEMPORAL_RANGE',
          comparator: 'No filter',
          expressionType: 'SIMPLE',
        },
      ],
    };
    const result = getSlicePayload(
      sliceName,
      formDataWithAdhocFilters,
      dashboards,
      owners,
      formDataFromSlice,
    );
    expect(result).toHaveProperty('params');
    expect(result).toHaveProperty('slice_name', sliceName);
    expect(result).toHaveProperty(
      'viz_type',
      formDataWithAdhocFilters.viz_type,
    );
    expect(result).toHaveProperty('datasource_id', 22);
    expect(result).toHaveProperty('datasource_type', 'table');
    expect(result).toHaveProperty('dashboards', dashboards);
    expect(result).toHaveProperty('owners', owners);
    expect(result).toHaveProperty('query_context');
    expect(JSON.parse(result.params).adhoc_filters).toEqual(
      formDataWithAdhocFilters.adhoc_filters,
    );
  });

  test('should return the correct payload when formDataWithNativeFilters has a filter with isExtra set to true', () => {
    const formDataWithAdhocFiltersWithExtra = {
      ...formDataWithNativeFilters,
      adhoc_filters: [
        {
          clause: 'WHERE',
          subject: 'year',
          operator: 'TEMPORAL_RANGE',
          comparator: 'No filter',
          expressionType: 'SIMPLE',
        },
      ],
    };
    const result = getSlicePayload(
      sliceName,
      formDataWithAdhocFiltersWithExtra,
      dashboards,
      owners,
      formDataFromSlice,
    );
    expect(result).toHaveProperty('params');
    expect(result).toHaveProperty('slice_name', sliceName);
    expect(result).toHaveProperty(
      'viz_type',
      formDataWithAdhocFiltersWithExtra.viz_type,
    );
    expect(result).toHaveProperty('datasource_id', 22);
    expect(result).toHaveProperty('datasource_type', 'table');
    expect(result).toHaveProperty('dashboards', dashboards);
    expect(result).toHaveProperty('owners', owners);
    expect(result).toHaveProperty('query_context');
    expect(JSON.parse(result.params).adhoc_filters).toEqual(
      formDataFromSlice.adhoc_filters,
    );
  });

  test('should return the correct payload when formDataWithNativeFilters has a filter with isExtra set to true in mixed chart', () => {
    const formDataFromSliceWithAdhocFilterB = {
      ...formDataFromSlice,
      adhoc_filters_b: [
        {
          clause: 'WHERE',
          subject: 'year',
          operator: 'TEMPORAL_RANGE',
          comparator: 'No filter',
          expressionType: 'SIMPLE',
        },
      ],
    };
    const formDataWithAdhocFiltersWithExtra = {
      ...formDataWithNativeFilters,
      viz_type: 'mixed_timeseries',
      adhoc_filters: [
        {
          clause: 'WHERE',
          subject: 'year',
          operator: 'TEMPORAL_RANGE',
          comparator: 'No filter',
          expressionType: 'SIMPLE',
          isExtra: true,
        },
      ],
      adhoc_filters_b: [
        {
          clause: 'WHERE',
          subject: 'year',
          operator: 'TEMPORAL_RANGE',
          comparator: 'No filter',
          expressionType: 'SIMPLE',
          isExtra: true,
        },
      ],
    };
    const result = getSlicePayload(
      sliceName,
      formDataWithAdhocFiltersWithExtra,
      dashboards,
      owners,
      formDataFromSliceWithAdhocFilterB,
    );

    expect(JSON.parse(result.params).adhoc_filters).toEqual(
      formDataFromSliceWithAdhocFilterB.adhoc_filters,
    );
    expect(JSON.parse(result.params).adhoc_filters_b).toEqual(
      formDataFromSliceWithAdhocFilterB.adhoc_filters_b,
    );
  });
});
