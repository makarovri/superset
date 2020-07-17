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
import React, { FunctionComponent, useState, useRef } from 'react';
import { Alert, Button, Modal } from 'react-bootstrap';
// @ts-ignore
import Dialog from 'react-bootstrap-dialog';
import { t } from '@superset-ui/translation';
import { SupersetClient } from '@superset-ui/connection';

import getClientErrorObject from '../utils/getClientErrorObject';
import DatasourceEditor from './DatasourceEditor';
import withToasts from '../messageToasts/enhancers/withToasts';

interface DatasourceModalProps {
  addSuccessToast: (msg: string) => void;
  datasource: any;
  onChange: () => {};
  onDatasourceSave: (datasource: object, errors?: Array<any>) => {};
  onHide: () => {};
  show: false;
}

const DatasourceModal: FunctionComponent<DatasourceModalProps> = ({
  addSuccessToast,
  datasource,
  onDatasourceSave,
  onHide,
  show,
}) => {
  const [currentDatasource, setCurrentDatasource] = useState(datasource);
  const [errors, setErrors] = useState<any[]>([]);
  const dialog = useRef<any>(null);

  const onConfirmSave = () => {
    const datasetId = currentDatasource.id;
    currentDatasource.columns.forEach((column: any) => {
      delete column.__expanded;
      delete column.changed_on;
      delete column.created_on;
    });
    currentDatasource.metrics.forEach((column: any) => {
      delete column.changed_on;
      delete column.created_on;
    });
    delete currentDatasource.id;
    delete currentDatasource.datasource_type;
    delete currentDatasource.url;
    // delete currentDatasource.database;
    SupersetClient.put({
      endpoint: `/api/v1/dataset/${datasetId}`,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...currentDatasource }),
    })
      .then(({ json }) => {
        onHide();
        addSuccessToast(t('The datasource has been saved'));
        onDatasourceSave(json);
      })
      .catch(response => {
        return getClientErrorObject(response).then((error: any) => {
          debugger;
          dialog.current.show({
            title: 'Error',
            bsSize: 'medium',
            bsStyle: 'danger',
            actions: [Dialog.DefaultAction('Ok', () => {}, 'btn-danger')],
            body: error || error?.statusText || t('An error has occurred'),
          });
        });
      });
  };

  const onDatasourceChange = (data: object, err: Array<any>) => {
    setCurrentDatasource(data);
    setErrors(err);
  };

  const renderSaveDialog = () => (
    <div>
      <Alert
        bsStyle="warning"
        className="pointer"
        onClick={dialog.current.hideAlert}
      >
        <div>
          <i className="fa fa-exclamation-triangle" />{' '}
          {t(`The data source configuration exposed here
                affects all the charts using this datasource.
                Be mindful that changing settings
                here may affect other charts
                in undesirable ways.`)}
        </div>
      </Alert>
      {t('Are you sure you want to save and apply changes?')}
    </div>
  );

  const onClickSave = () => {
    dialog.current.show({
      title: t('Confirm save'),
      bsSize: 'medium',
      actions: [Dialog.CancelAction(), Dialog.OKAction(onConfirmSave)],
      body: renderSaveDialog(),
    });
  };

  return (
    <Modal show={show} onHide={onHide} bsSize="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <div>
            <span className="float-left">
              {t('Datasource Editor for ')}
              <strong>{datasource.name}</strong>
            </span>
          </div>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {show && (
          <DatasourceEditor
            datasource={datasource}
            onChange={onDatasourceChange}
          />
        )}
      </Modal.Body>
      <Modal.Footer>
        <span className="float-left">
          <Button
            bsSize="sm"
            bsStyle="default"
            target="_blank"
            href={datasource.edit_url || datasource.url}
          >
            {t('Use Legacy Datasource Editor')}
          </Button>
        </span>

        <span className="float-right">
          <Button
            bsSize="sm"
            bsStyle="primary"
            className="m-r-5"
            onClick={onClickSave}
            disabled={errors.length > 0}
          >
            {t('Save')}
          </Button>
          <Button bsSize="sm" onClick={onHide}>
            {t('Cancel')}
          </Button>
          <Dialog ref={dialog} />
        </span>
      </Modal.Footer>
    </Modal>
  );
};

export default withToasts(DatasourceModal);
