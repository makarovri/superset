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
import React, { useEffect, useState } from 'react';
import { styled, t, QueryFormData } from '@superset-ui/core';
import { Collapse } from 'src/common/components';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import {
  ColumnOption,
  MetricOption,
  ControlType,
} from '@superset-ui/chart-controls';
import Control from './Control';

interface DatasourceControl {
  validationErrors: any;
  mapStateToProps: QueryFormData;
  type: ControlType;
  label: string;
  datasource?: any;
}

interface Props {
  datasource: {
    columns: Array<any>;
    metrics: Array<any>;
  };
  controls: {
    datasource: DatasourceControl;
  };
  actions: any;
}

const DatasourceContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.grayscale.light4};
  .field-selections {
    padding: 0 ${({ theme }) => 2 * theme.gridUnit}px;
  }
  .ant-collapse
    > .ant-collapse-item
    > .ant-collapse-header
    .ant-collapse-arrow {
    right: ${({ theme }) => theme.gridUnit * -50}px;
  }
  .ant-collapse > .ant-collapse-item > .ant-collapse-header {
    padding-left: 10px;
  }
  .form-control.input-sm {
    margin-bottom: ${({ theme }) => theme.gridUnit * 3}px;
  }
  .ant-collapse-item {
    background-color: ${({ theme }) => theme.colors.grayscale.light4};
    .anticon.anticon-right.ant-collapse-arrow > svg {
      transform: rotate(90deg) !important;
    }
  }
  .ant-collapse-item.ant-collapse-item-active {
    .anticon.anticon-right.ant-collapse-arrow > svg {
      transform: rotate(-90deg) !important;
    }
  }
  .header {
    font-size: ${({ theme }) => theme.typography.sizes.l}px;
    margin-left: ${({ theme }) => theme.gridUnit * -2}px;
  }
  .ant-collapse-content-box > div {
    margin-left: -14px;
  }
  .type-label {
    text-align: left;
  }
  .metric-option .option-label {
    margin-left: -20px;
  }
`;

const DataSourcePanel = ({
  datasource,
  controls: { datasource: datasourceControl },
  actions,
}: Props) => {
  const { columns, metrics } = datasource;
  const [lists, setColList] = useState({
    columns,
    metrics,
  });
  const search = ({ target: { value } }: { target: { value: string } }) => {
    const filteredColumns = lists.columns.filter(
      obj => obj.column_name.indexOf(value) !== -1,
    );
    const filteredMetrics = lists.metrics.filter(
      objs => objs.metric_name.indexOf(value) !== -1,
    );
    if (value === '') {
      setColList({ columns, metrics });
    } else setColList({ columns: filteredColumns, metrics: filteredMetrics });
  };
  useEffect(() => {
    setColList({
      columns,
      metrics,
    });
  }, [datasource]);

  const Metrics = ({ index, style }: ListChildComponentProps) => {
    return (
      <div
        key={lists.metrics[index].metric_name}
        className="metric"
        style={style}
      >
        <MetricOption metric={lists.metrics[index]} showType />
      </div>
    );
  };

  const Columns = ({ index, style }: ListChildComponentProps) => {
    return (
      <div
        key={lists.columns[index].column_name}
        className="column"
        style={style}
      >
        <ColumnOption column={lists.columns[index]} showType />
      </div>
    );
  };
  return (
    <DatasourceContainer>
      <Control
        {...datasourceControl}
        name="datasource"
        validationErrors={datasourceControl.validationErrors}
        actions={actions}
        formData={datasourceControl.mapStateToProps}
      />
      <div className="field-selections">
        <input
          type="text"
          onChange={search}
          className="form-control input-sm"
          placeholder={t('Search Metrics & Columns')}
        />
        <Collapse
          accordion
          bordered={false}
          defaultActiveKey={['column', 'metrics']}
        >
          <Collapse.Panel
            header={<span className="header">Columns</span>}
            key="column"
          >
            <List
              height={100}
              itemCount={lists.columns.length}
              itemSize={35}
              width={250}
            >
              {Columns}
            </List>
          </Collapse.Panel>
        </Collapse>
        <Collapse accordion bordered={false}>
          <Collapse.Panel
            header={<span className="header">Metrics</span>}
            key="metrics"
          >
            <List
              height={100}
              itemCount={lists.metrics.length}
              itemSize={35}
              width={250}
            >
              {Metrics}
            </List>
          </Collapse.Panel>
        </Collapse>
      </div>
    </DatasourceContainer>
  );
};

export default DataSourcePanel;
