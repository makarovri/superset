// DODO was here

import { GenericDataType } from './QueryResponse';
import { QueryFormColumn } from './QueryFormData';

export interface AdhocColumn {
  hasCustomLabel?: boolean;
  label?: string;
  // DODO added
  labelEN?: string;
  labelRU?: string;
  optionName?: string;
  sqlExpression: string;
  expressionType: 'SQL';
  columnType?: 'BASE_AXIS' | 'SERIES';
  timeGrain?: string;
  datasourceWarning?: boolean;
}

/**
 * A column that is physically defined in datasource.
 */
export type PhysicalColumn = string;

/**
 * Column information defined in datasource.
 */
export interface Column {
  id?: number;
  type?: string;
  type_generic?: GenericDataType;
  column_name: string;
  groupby?: boolean;
  is_dttm?: boolean;
  filterable?: boolean;
  verbose_name?: string | null;
  // DODO added
  verbose_name_RU?: string | null;
  verbose_name_EN?: string | null;
  description?: string | null;
  expression?: string | null;
  database_expression?: string | null;
  python_date_format?: string | null;

  // used for advanced_data_type
  optionName?: string;
  filterBy?: string;
  value?: string;
  advanced_data_type?: string;
}

export function isPhysicalColumn(column?: any): column is PhysicalColumn {
  return typeof column === 'string';
}

export function isAdhocColumn(column?: any): column is AdhocColumn {
  return (
    typeof column !== 'string' &&
    column?.sqlExpression !== undefined &&
    column?.label !== undefined &&
    (column?.expressionType === undefined || column?.expressionType === 'SQL')
  );
}

export function isQueryFormColumn(column: any): column is QueryFormColumn {
  return isPhysicalColumn(column) || isAdhocColumn(column);
}

export default {};
