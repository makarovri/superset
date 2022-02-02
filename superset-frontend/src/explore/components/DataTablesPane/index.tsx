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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GenericDataType, JsonObject, styled, t } from '@superset-ui/core';
import Collapse from 'src/components/Collapse';
import Tabs from 'src/components/Tabs';
import Loading from 'src/components/Loading';
import TableView, { EmptyWrapperType } from 'src/components/TableView';
import { getChartDataRequest } from 'src/chart/chartAction';
import { getClientErrorObject } from 'src/utils/getClientErrorObject';
import {
  getItem,
  setItem,
  LocalStorageKeys,
} from 'src/utils/localStorageHelpers';
import {
  CopyToClipboardButton,
  FilterInput,
  RowCount,
  useFilteredTableData,
  useTableColumns,
} from 'src/explore/components/DataTableControl';
import { applyFormattingToTabularData } from 'src/utils/common';

const RESULT_TYPES = {
  results: 'results' as const,
  samples: 'samples' as const,
};

const getDefaultDataTablesState = (value: any) => ({
  [RESULT_TYPES.results]: value,
  [RESULT_TYPES.samples]: value,
});

const DATA_TABLE_PAGE_SIZE = 50;

const DATAPANEL_KEY = 'data';

const TableControlsWrapper = styled.div`
  display: flex;
  align-items: center;

  span {
    flex-shrink: 0;
  }
`;

const SouthPane = styled.div`
  position: relative;
  background-color: ${({ theme }) => theme.colors.grayscale.light5};
  z-index: 5;
  overflow: hidden;
`;

const TabsWrapper = styled.div<{ contentHeight: number }>`
  height: ${({ contentHeight }) => contentHeight}px;
  overflow: hidden;

  .table-condensed {
    height: 100%;
    overflow: auto;
  }
`;

const CollapseWrapper = styled.div`
  height: 100%;

  .collapse-inner {
    height: 100%;

    .ant-collapse-item {
      height: 100%;

      .ant-collapse-content {
        height: calc(100% - ${({ theme }) => theme.gridUnit * 8}px);

        .ant-collapse-content-box {
          padding-top: 0;
          height: 100%;
        }
      }
    }
  }
`;

const Error = styled.pre`
  margin-top: ${({ theme }) => `${theme.gridUnit * 4}px`};
`;

interface DataTableProps {
  columnNames: string[];
  columnTypes: GenericDataType[] | undefined;
  datasource: string | undefined;
  filterText: string;
  data: object[] | undefined;
  isLoading: boolean;
  error: string | undefined;
  errorMessage: React.ReactElement | undefined;
}

const DataTable = ({
  columnNames,
  columnTypes,
  datasource,
  filterText,
  data,
  isLoading,
  error,
  errorMessage,
}: DataTableProps) => {
  // this is to preserve the order of the columns, even if there are integer values,
  // while also only grabbing the first column's keys
  const columns = useTableColumns(columnNames, columnTypes, data, datasource);
  const filteredData = useFilteredTableData(filterText, data);

  if (isLoading) {
    return <Loading />;
  }
  if (error) {
    return <Error>{error}</Error>;
  }
  if (data) {
    if (data.length === 0) {
      return <span>No data</span>;
    }
    return (
      <TableView
        columns={columns}
        data={filteredData}
        pageSize={DATA_TABLE_PAGE_SIZE}
        noDataText={t('No data')}
        emptyWrapperType={EmptyWrapperType.Small}
        className="table-condensed"
        isPaginationSticky
        showRowCount={false}
        small
      />
    );
  }
  if (errorMessage) {
    return <Error>{errorMessage}</Error>;
  }
  return null;
};

export const DataTablesPane = ({
  queryFormData,
  tableSectionHeight,
  onCollapseChange,
  chartStatus,
  ownState,
  errorMessage,
  queriesResponse,
}: {
  queryFormData: Record<string, any>;
  tableSectionHeight: number;
  chartStatus: string;
  ownState?: JsonObject;
  onCollapseChange: (openPanelName: string) => void;
  errorMessage?: JSX.Element;
  queriesResponse: Record<string, any>;
}) => {
  const [data, setData] = useState(getDefaultDataTablesState([]));
  const [isLoading, setIsLoading] = useState(getDefaultDataTablesState(true));
  const [columnNames, setColumnNames] = useState(getDefaultDataTablesState([]));
  const [columnTypes, setColumnTypes] = useState(getDefaultDataTablesState([]));
  const [error, setError] = useState(getDefaultDataTablesState(''));
  const [filterText, setFilterText] = useState('');
  const [activeTabKey, setActiveTabKey] = useState<string>(
    RESULT_TYPES.results,
  );
  const [isRequestPending, setIsRequestPending] = useState<{
    [RESULT_TYPES.results]?: boolean;
    [RESULT_TYPES.samples]?: boolean;
  }>(getDefaultDataTablesState(false));
  const [panelOpen, setPanelOpen] = useState(
    getItem(LocalStorageKeys.is_datapanel_open, false),
  );

  const formattedData = useMemo(
    () => ({
      [RESULT_TYPES.results]: applyFormattingToTabularData(
        data[RESULT_TYPES.results],
      ),
      [RESULT_TYPES.samples]: applyFormattingToTabularData(
        data[RESULT_TYPES.samples],
      ),
    }),
    [data],
  );

  const getSamplesData = useCallback(() => {
    setIsLoading(prevIsLoading => ({
      ...prevIsLoading,
      [RESULT_TYPES.samples]: true,
    }));
    return getChartDataRequest({
      formData: queryFormData,
      resultFormat: 'json',
      resultType: 'samples',
      ownState,
    })
      .then(({ json }) => {
        // Only displaying the first query is currently supported
        if (json.result.length > 1) {
          const data: any[] = [];
          json.result.forEach((item: { data: any[] }) => {
            item.data.forEach((row, i) => {
              if (data[i] !== undefined) {
                data[i] = { ...data[i], ...row };
              } else {
                data[i] = row;
              }
            });
          });
          setData(prevData => ({
            ...prevData,
            [RESULT_TYPES.samples]: data,
          }));
        } else {
          setData(prevData => ({
            ...prevData,
            [RESULT_TYPES.samples]: json.result[0].data,
          }));
        }
        const checkCols = json?.result[0]?.data?.length
          ? Object.keys(json.result[0].data[0])
          : null;
        setColumnNames(prevColumnNames => ({
          ...prevColumnNames,
          [RESULT_TYPES.samples]: json.result[0].columns || checkCols,
        }));
        setColumnTypes(prevColumnTypes => ({
          ...prevColumnTypes,
          [RESULT_TYPES.samples]: json.result[0].coltypes || [],
        }));
        setIsLoading(prevIsLoading => ({
          ...prevIsLoading,
          [RESULT_TYPES.samples]: false,
        }));
        setError(prevError => ({
          ...prevError,
          [RESULT_TYPES.samples]: undefined,
        }));
      })
      .catch(response => {
        getClientErrorObject(response).then(({ error, message }) => {
          setError(prevError => ({
            ...prevError,
            [RESULT_TYPES.samples]:
              error || message || t('Sorry, An error occurred'),
          }));
          setIsLoading(prevIsLoading => ({
            ...prevIsLoading,
            [RESULT_TYPES.samples]: false,
          }));
        });
      });
  }, [queryFormData, columnNames]);

  useEffect(() => {
    setItem(LocalStorageKeys.is_datapanel_open, panelOpen);
  }, [panelOpen]);

  useEffect(() => {
    setIsRequestPending(prevState => ({
      ...prevState,
      [RESULT_TYPES.samples]: true,
    }));
  }, [queryFormData?.datasource]);

  useEffect(() => {
    if (queriesResponse && chartStatus === 'success') {
      const { colnames, coltypes, data } = queriesResponse[0];
      setColumnNames(prevColumnNames => ({
        ...prevColumnNames,
        [RESULT_TYPES.results]: colnames ?? [],
      }));
      setColumnTypes(prevColumnTypes => ({
        ...prevColumnTypes,
        [RESULT_TYPES.results]: coltypes ?? [],
      }));
      setData(prevData => ({
        ...prevData,
        [RESULT_TYPES.results]: data,
      }));
      setIsLoading(prevIsLoading => ({
        ...prevIsLoading,
        [RESULT_TYPES.results]: false,
      }));
    }
  }, [queriesResponse, chartStatus]);

  useEffect(() => {
    if (
      panelOpen &&
      isRequestPending[RESULT_TYPES.samples] &&
      activeTabKey === RESULT_TYPES.samples
    ) {
      setIsRequestPending(prevState => ({
        ...prevState,
        [RESULT_TYPES.samples]: false,
      }));
      getSamplesData();
    }
  }, [
    panelOpen,
    isRequestPending,
    getSamplesData,
    activeTabKey,
    chartStatus,
    errorMessage,
  ]);

  const TableControls = (
    <TableControlsWrapper>
      <RowCount data={data[activeTabKey]} loading={isLoading[activeTabKey]} />
      <CopyToClipboardButton
        data={formattedData[activeTabKey]}
        columns={columnNames[activeTabKey]}
      />
      <FilterInput onChangeHandler={setFilterText} />
    </TableControlsWrapper>
  );

  const handleCollapseChange = (openPanelName: string) => {
    onCollapseChange(openPanelName);
    setPanelOpen(!!openPanelName);
  };

  return (
    <SouthPane data-test="some-purposeful-instance">
      <TabsWrapper contentHeight={tableSectionHeight}>
        <CollapseWrapper data-test="data-tab">
          <Collapse
            accordion
            bordered={false}
            defaultActiveKey={panelOpen ? DATAPANEL_KEY : undefined}
            onChange={handleCollapseChange}
            bold
            ghost
            className="collapse-inner"
          >
            <Collapse.Panel header={t('Data')} key={DATAPANEL_KEY}>
              <Tabs
                fullWidth={false}
                tabBarExtraContent={TableControls}
                activeKey={activeTabKey}
                onChange={setActiveTabKey}
              >
                <Tabs.TabPane
                  tab={t('View results')}
                  key={RESULT_TYPES.results}
                >
                  <DataTable
                    isLoading={isLoading[RESULT_TYPES.results]}
                    data={data[RESULT_TYPES.results]}
                    datasource={queryFormData?.datasource}
                    columnNames={columnNames[RESULT_TYPES.results]}
                    columnTypes={columnTypes[RESULT_TYPES.results]}
                    filterText={filterText}
                    error={error[RESULT_TYPES.results]}
                    errorMessage={errorMessage}
                  />
                </Tabs.TabPane>
                <Tabs.TabPane
                  tab={t('View samples')}
                  key={RESULT_TYPES.samples}
                >
                  <DataTable
                    isLoading={isLoading[RESULT_TYPES.samples]}
                    data={data[RESULT_TYPES.samples]}
                    datasource={queryFormData?.datasource}
                    columnNames={columnNames[RESULT_TYPES.samples]}
                    columnTypes={columnTypes[RESULT_TYPES.samples]}
                    filterText={filterText}
                    error={error[RESULT_TYPES.samples]}
                    errorMessage={errorMessage}
                  />
                </Tabs.TabPane>
              </Tabs>
            </Collapse.Panel>
          </Collapse>
        </CollapseWrapper>
      </TabsWrapper>
    </SouthPane>
  );
};
