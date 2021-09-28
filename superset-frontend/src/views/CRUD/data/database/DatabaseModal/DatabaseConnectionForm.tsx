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
import React, { FormEvent } from 'react';
import { SupersetTheme, JsonObject, t } from '@superset-ui/core';
import { InputProps } from 'antd/lib/input';
import { Switch } from 'src/common/components';
import InfoTooltip from 'src/components/InfoTooltip';
import ValidatedInput from 'src/components/Form/LabeledErrorBoundInput';
import {
  accountField,
  warehouseField,
  roleField,
  TableCatalog,
  CredentialsInfo,
} from 'src/views/CRUD/data/database/DatabaseModal/ExtraFields';
import {
  formScrollableStyles,
  validatedFormStyles,
  toggleStyle,
  infoTooltip,
} from './styles';
import { DatabaseForm, DatabaseObject } from '../types';

export const FormFieldOrder = [
  'host',
  'port',
  'database',
  'username',
  'password',
  'database_name',
  'credentials_info',
  'catalog',
  'query',
  'encryption',
  'account',
  'warehouse',
  'role',
];

export interface FieldPropTypes {
  required: boolean;
  hasTooltip?: boolean;
  tooltipText?: (valuse: any) => string;
  onParametersChange: (value: any) => string;
  onParametersUploadFileChange: (value: any) => string;
  changeMethods: { onParametersChange: (value: any) => string } & {
    onChange: (value: any) => string;
  } & {
    onQueryChange: (value: any) => string;
  } & { onParametersUploadFileChange: (value: any) => string } & {
    onAddTableCatalog: () => void;
    onRemoveTableCatalog: (idx: number) => void;
  };
  validationErrors: JsonObject | null;
  getValidation: () => void;
  db?: DatabaseObject;
  isEditMode?: boolean;
  sslForced?: boolean;
  defaultDBName?: string;
  editNewDb?: boolean;
}

const hostField = ({
  required,
  changeMethods,
  getValidation,
  validationErrors,
  db,
}: FieldPropTypes) => (
  <ValidatedInput
    id="host"
    name="host"
    value={db?.parameters?.host}
    required={required}
    hasTooltip
    tooltipText={t(
      'This can be either an IP address (e.g. 127.0.0.1) or a domain name (e.g. mydatabase.com).',
    )}
    validationMethods={{ onBlur: getValidation }}
    errorMessage={validationErrors?.host}
    placeholder="e.g. 127.0.0.1"
    className="form-group-w-50"
    label="Host"
    onChange={changeMethods.onParametersChange}
  />
);
const portField = ({
  required,
  changeMethods,
  getValidation,
  validationErrors,
  db,
}: FieldPropTypes) => (
  <>
    <ValidatedInput
      id="port"
      name="port"
      type="number"
      required={required}
      value={db?.parameters?.port as number}
      validationMethods={{ onBlur: getValidation }}
      errorMessage={validationErrors?.port}
      placeholder="e.g. 5432"
      className="form-group-w-50"
      label="Port"
      onChange={changeMethods.onParametersChange}
    />
  </>
);
const databaseField = ({
  required,
  changeMethods,
  getValidation,
  validationErrors,
  db,
}: FieldPropTypes) => (
  <ValidatedInput
    id="database"
    name="database"
    required={required}
    value={db?.parameters?.database}
    validationMethods={{ onBlur: getValidation }}
    errorMessage={validationErrors?.database}
    placeholder="e.g. world_population"
    label="Database name"
    onChange={changeMethods.onParametersChange}
    helpText={t('Copy the name of the  database you are trying to connect to.')}
  />
);
const usernameField = ({
  required,
  changeMethods,
  getValidation,
  validationErrors,
  db,
}: FieldPropTypes) => (
  <ValidatedInput
    id="username"
    name="username"
    required={required}
    value={db?.parameters?.username}
    validationMethods={{ onBlur: getValidation }}
    errorMessage={validationErrors?.username}
    placeholder="e.g. Analytics"
    label="Username"
    onChange={changeMethods.onParametersChange}
  />
);
const passwordField = ({
  required,
  changeMethods,
  getValidation,
  validationErrors,
  db,
  isEditMode,
}: FieldPropTypes) => (
  <ValidatedInput
    id="password"
    name="password"
    required={required}
    type={isEditMode && 'password'}
    value={db?.parameters?.password}
    validationMethods={{ onBlur: getValidation }}
    errorMessage={validationErrors?.password}
    placeholder="e.g. ********"
    label="Password"
    onChange={changeMethods.onParametersChange}
  />
);
const displayField = ({
  changeMethods,
  getValidation,
  validationErrors,
  db,
}: FieldPropTypes) => (
  <>
    <ValidatedInput
      id="database_name"
      name="database_name"
      required
      value={db?.database_name}
      validationMethods={{ onBlur: getValidation }}
      errorMessage={validationErrors?.database_name}
      placeholder=""
      label={t('Display Name')}
      onChange={changeMethods.onChange}
      helpText={t(
        'Pick a nickname for this database to display as in Superset.',
      )}
    />
  </>
);

const queryField = ({
  required,
  changeMethods,
  getValidation,
  validationErrors,
  db,
}: FieldPropTypes) => (
  <ValidatedInput
    id="query_input"
    name="query_input"
    required={required}
    value={db?.query_input || ''}
    validationMethods={{ onBlur: getValidation }}
    errorMessage={validationErrors?.query}
    placeholder="e.g. param1=value1&param2=value2"
    label="Additional Parameters"
    onChange={changeMethods.onQueryChange}
    helpText={t('Add additional custom parameters')}
  />
);

const forceSSLField = ({
  isEditMode,
  changeMethods,
  db,
  sslForced,
}: FieldPropTypes) => (
  <div css={(theme: SupersetTheme) => infoTooltip(theme)}>
    <Switch
      disabled={sslForced && !isEditMode}
      checked={db?.parameters?.encryption || sslForced}
      onChange={changed => {
        changeMethods.onParametersChange({
          target: {
            type: 'toggle',
            name: 'encryption',
            checked: true,
            value: changed,
          },
        });
      }}
    />
    <span css={toggleStyle}>SSL</span>
    <InfoTooltip
      tooltip={t('SSL Mode "require" will be used.')}
      placement="right"
      viewBox="0 -5 24 24"
    />
  </div>
);

const FORM_FIELD_MAP = {
  host: hostField,
  port: portField,
  database: databaseField,
  username: usernameField,
  password: passwordField,
  database_name: displayField,
  query: queryField,
  encryption: forceSSLField,
  credentials_info: CredentialsInfo,
  catalog: TableCatalog,
  warehouse: warehouseField,
  role: roleField,
  account: accountField,
};

const DatabaseConnectionForm = ({
  dbModel: { parameters },
  onParametersChange,
  onChange,
  onQueryChange,
  onParametersUploadFileChange,
  onAddTableCatalog,
  onRemoveTableCatalog,
  validationErrors,
  getValidation,
  db,
  isEditMode = false,
  sslForced,
  editNewDb,
}: {
  isEditMode?: boolean;
  sslForced: boolean;
  editNewDb?: boolean;
  dbModel: DatabaseForm;
  db: Partial<DatabaseObject> | null;
  onParametersChange: (
    event: FormEvent<InputProps> | { target: HTMLInputElement },
  ) => void;
  onChange: (
    event: FormEvent<InputProps> | { target: HTMLInputElement },
  ) => void;
  onQueryChange: (
    event: FormEvent<InputProps> | { target: HTMLInputElement },
  ) => void;
  onParametersUploadFileChange?: (
    event: FormEvent<InputProps> | { target: HTMLInputElement },
  ) => void;
  onAddTableCatalog: () => void;
  onRemoveTableCatalog: (idx: number) => void;
  validationErrors: JsonObject | null;
  getValidation: () => void;
}) => (
  <>
    <div
      // @ts-ignore
      css={(theme: SupersetTheme) => [
        formScrollableStyles,
        validatedFormStyles(theme),
      ]}
    >
      {parameters &&
        FormFieldOrder.filter(
          (key: string) =>
            Object.keys(parameters.properties).includes(key) ||
            key === 'database_name',
        ).map(field =>
          FORM_FIELD_MAP[field]({
            required: parameters.required?.includes(field),
            changeMethods: {
              onParametersChange,
              onChange,
              onQueryChange,
              onParametersUploadFileChange,
              onAddTableCatalog,
              onRemoveTableCatalog,
            },
            validationErrors,
            getValidation,
            db,
            key: field,
            isEditMode,
            sslForced,
            editNewDb,
          }),
        )}
    </div>
  </>
);
export const FormFieldMap = FORM_FIELD_MAP;

export default DatabaseConnectionForm;
