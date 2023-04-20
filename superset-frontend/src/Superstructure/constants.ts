/* eslint-disable theme-colors/no-literal-colors */
const API_V1 = '/api/v1';
const SUPERSET_ENDPOINT = '/superset';
const PLUGIN_SELECTOR = 'single-spa-application:supersetDashboardPlugin';

const DODOPIZZA_THEME = {
  colors: {
    primary: {
      base: '#ff6900',
      dark1: '#e86100',
      dark2: '#d15700',
      light1: '#fff0e6',
      light2: '#fff0e6',
      light3: '#d2edf4',
      light4: '#fff0e6',
      light5: '#f3f8fa',
    },
    secondary: {
      base: '#000',
      dark1: '#363636',
      dark2: '#555555',
      dark3: '#1B1F31',
      light1: '#8E94B0',
      light2: '#B4B8CA',
      light3: '#D9DBE4',
      light4: '#fff0e6',
      light5: '#F5F5F8',
    },
  },
};

const MESSAGES = {
  GET_MENU: {
    CONFIG: {
      stackTrace: 'GET_MENU',
      title: 'Getting dashboards from Superset',
    },
    NO_DASHBOARDS:
      'No dashboards were returned from Superset. In standalone Superset (https://analytics.dodois.io/) please add CERTIFIED BY (DODOPIZZA) and CERTIFICATION DETAILS (OfficeManager/Analytics) to all the needed dashboards',
    NOT_VALID_CERTIFICATION:
      'No dashboards can be displayed from Superset. Check CERTIFIED BY parameter i.e. "DODOPIZZA" and|or CERTIFICATION DETAILS "OfficeManager/Analytics" on all the needed dashboards',
    OTHER: 'While getting dashboards unexected error happened',
  },
  LOGIN: {
    CONFIG: {
      stackTrace: 'LOGIN',
      title: 'Log into Superset',
    },
    NO_TOKEN: 'No access token was returned from Superset',
    OTHER: 'While log in unexected error happened',
  },
  CSRF: {
    CONFIG: {
      stackTrace: 'CSRF',
      title: 'Get CSRF token from Superset',
    },
    NO_TOKEN: 'No CSRF token was returned from Superset',
    OTHER: 'While getting CSRF unexected error happened',
  },
};

const KNOWN_CERTIFICATAION_DETAILS = ['officemanager/analytics'];

const DODOPIZZA_KNOWLEDGEBASE_URL =
  'https://dodopizza.info/support/categories/7647d4b4-5108-4b5e-9054-43f40a2ab287/ru';
const DODOPIZZA_ANALYTICS_URL = 'https://analytics.dodois.io/dashboard/list/';

const SUPERSET_WEBSERVER_TIMEOUT = 60;
const USER_ROLES = {
  Admin: [
    ['can_delete', 'DashboardEmailScheduleView'],
    ['menu_access', 'Data'],
    ['menu_access', 'Charts'],
    ['all_database_access', 'all_database_access'],
    ['can_delete', 'AlertModelView'],
    ['menu_access', 'Dashboards'],
    ['menu_access', 'Datasets'],
    ['can_delete', 'RowLevelSecurityFiltersModelView'],
    ['can_edit', 'SliceEmailScheduleView'],
    ['can_copy_dash', 'Superset'],
    ['can_delete', 'DruidColumnInlineView'],
    ['menu_access', 'Druid Clusters'],
    ['can_slice', 'Superset'],
    ['can_list', 'AsyncEventsRestApi'],
    ['copyrole', 'RoleModelView'],
    ['can_csrf_token', 'Superset'],
    ['can_datasources', 'Superset'],
    ['can_edit', 'RoleModelView'],
    ['muldelete', 'AccessRequestsModelView'],
    ['can_this_form_post', 'ResetMyPasswordView'],
    ['can_expanded', 'TableSchemaView'],
    ['can_override_role_permissions', 'Superset'],
    ['can_delete', 'RegisterUserModelView'],
    ['can_warm_up_cache', 'Superset'],
    ['yaml_export', 'DruidDatasourceModelView'],
    ['can_add', 'DruidColumnInlineView'],
    ['menu_access', 'Databases'],
    ['muldelete', 'DruidClusterModelView'],
    ['can_created_dashboards', 'Superset'],
    ['can_get', 'OpenApi'],
    ['can_fave_dashboards', 'Superset'],
    ['can_extra_table_metadata', 'Superset'],
    ['can_query', 'Api'],
    ['menu_access', 'Druid Datasources'],
    ['can_queries', 'Superset'],
    ['can_write', 'CssTemplate'],
    ['can_list', 'RowLevelSecurityFiltersModelView'],
    ['can_add_slices', 'Superset'],
    ['can_get', 'TagView'],
    ['can_request_access', 'Superset'],
    ['can_schemas_access_for_csv_upload', 'Superset'],
    ['can_post', 'TableSchemaView'],
    ['can_put', 'TabStateView'],
    ['can_add', 'DruidDatasourceModelView'],
    ['can_publish', 'Superset'],
    ['can_get', 'MenuApi'],
    ['can_show', 'AccessRequestsModelView'],
    ['can_dashboard', 'Superset'],
    ['can_testconn', 'Superset'],
    ['can_add', 'AccessRequestsModelView'],
    ['can_show', 'UserOAuthModelView'],
    ['can_list', 'DynamicPlugin'],
    ['can_query_form_data', 'Api'],
    ['can_available_domains', 'Superset'],
    ['menu_access', 'Row Level Security'],
    ['can_results', 'Superset'],
    ['can_list', 'AlertLogModelView'],
    ['can_this_form_get', 'ResetPasswordView'],
    ['can_external_metadata', 'Datasource'],
    ['can_list', 'DruidMetricInlineView'],
    ['can_edit', 'DruidColumnInlineView'],
    ['can_approve', 'Superset'],
    ['menu_access', 'Security'],
    ['can_this_form_post', 'UserInfoEditView'],
    ['can_edit', 'DruidMetricInlineView'],
    ['can_favstar', 'Superset'],
    ['can_select_star', 'Superset'],
    ['menu_access', 'List Users'],
    ['can_write', 'Database'],
    ['can_show', 'RegisterUserModelView'],
    ['can_this_form_get', 'ResetMyPasswordView'],
    ['can_show', 'AlertObservationModelView'],
    ['can_write', 'Annotation'],
    ['can_scan_new_datasources', 'Druid'],
    ['can_delete', 'TabStateView'],
    ['muldelete', 'DashboardEmailScheduleView'],
    ['can_show', 'DruidDatasourceModelView'],
    ['can_read', 'Query'],
    ['can_read', 'Dataset'],
    ['can_edit', 'DynamicPlugin'],
    ['can_this_form_post', 'ExcelToDatabaseView'],
    ['can_csv', 'Superset'],
    ['can_user_slices', 'Superset'],
    ['can_get', 'TabStateView'],
    ['can_search_queries', 'Superset'],
    ['can_time_range', 'Api'],
    ['can_add', 'AlertModelView'],
    ['can_read', 'CssTemplate'],
    ['can_list', 'UserOAuthModelView'],
    ['can_show', 'DynamicPlugin'],
    ['can_show', 'AlertLogModelView'],
    ['muldelete', 'DruidDatasourceModelView'],
    ['can_list', 'DruidColumnInlineView'],
    ['can_edit', 'UserOAuthModelView'],
    ['can_delete', 'DruidClusterModelView'],
    ['can_show', 'DashboardEmailScheduleView'],
    ['can_sqllab_history', 'Superset'],
    ['can_post', 'TabStateView'],
    ['can_read', 'Annotation'],
    ['can_delete', 'TagView'],
    ['can_sqllab', 'Superset'],
    ['menu_access', "User's Statistics"],
    ['can_external_metadata_by_name', 'Datasource'],
    ['can_sqllab_viz', 'Superset'],
    ['can_explore', 'Superset'],
    ['can_read', 'ReportSchedule'],
    ['can_profile', 'Superset'],
    ['can_write', 'ReportSchedule'],
    ['can_add', 'SliceEmailScheduleView'],
    ['can_get_value', 'KV'],
    ['can_add', 'DruidClusterModelView'],
    ['can_show', 'SliceEmailScheduleView'],
    ['can_read', 'Log'],
    ['can_function_names', 'Database'],
    ['all_query_access', 'all_query_access'],
    ['menu_access', 'Annotation Layers'],
    ['can_shortner', 'R'],
    ['can_show', 'RowLevelSecurityFiltersModelView'],
    ['menu_access', 'Action Log'],
    ['can_delete_query', 'TabStateView'],
    ['menu_access', 'Alerts'],
    ['menu_access', 'Upload a CSV'],
    ['can_store', 'KV'],
    ['can_tagged_objects', 'TagView'],
    ['can_list', 'RoleModelView'],
    ['can_edit', 'RowLevelSecurityFiltersModelView'],
    ['can_add', 'DynamicPlugin'],
    ['can_recent_activity', 'Superset'],
    ['menu_access', 'Import Dashboards'],
    ['can_invalidate', 'CacheRestApi'],
    ['can_tables', 'Superset'],
    ['can_explore_json', 'Superset'],
    ['can_show', 'SwaggerView'],
    ['menu_access', 'SQL Lab'],
    ['can_write', 'Dataset'],
    ['can_sqllab_table_viz', 'Superset'],
    ['menu_access', 'Manage'],
    ['can_show', 'RoleModelView'],
    ['muldelete', 'SliceEmailScheduleView'],
    ['can_this_form_get', 'UserInfoEditView'],
    ['menu_access', 'Scan New Datasources'],
    ['can_read', 'Database'],
    ['can_delete', 'DynamicPlugin'],
    ['all_datasource_access', 'all_datasource_access'],
    ['can_sql_json', 'Superset'],
    ['can_created_slices', 'Superset'],
    ['can_migrate_query', 'TabStateView'],
    ['can_add', 'RowLevelSecurityFiltersModelView'],
    ['can_add', 'DashboardEmailScheduleView'],
    ['can_my_queries', 'SqlLab'],
    ['can_list', 'AlertObservationModelView'],
    ['can_this_form_post', 'CsvToDatabaseView'],
    ['menu_access', 'List Roles'],
    ['menu_access', 'SQL Editor'],
    ['can_sync_druid_source', 'Superset'],
    ['can_fave_slices', 'Superset'],
    ['can_read', 'Dashboard'],
    ['can_list', 'DruidDatasourceModelView'],
    ['can_filter', 'Superset'],
    ['can_save', 'Datasource'],
    ['can_write', 'Chart'],
    ['menu_access', 'CSS Templates'],
    ['can_userinfo', 'UserOAuthModelView'],
    ['can_this_form_post', 'ResetPasswordView'],
    ['can_share_dashboard', 'Superset'],
    ['menu_access', 'Refresh Druid Metadata'],
    ['menu_access', 'Access requests'],
    ['can_add', 'UserOAuthModelView'],
    ['can_activate', 'TabStateView'],
    ['can_download', 'RowLevelSecurityFiltersModelView'],
    ['can_edit', 'AlertModelView'],
    ['can_list', 'DashboardEmailScheduleView'],
    ['can_edit', 'DashboardEmailScheduleView'],
    ['menu_access', 'Chart Emails'],
    ['can_read', 'SavedQuery'],
    ['can_list', 'SliceEmailScheduleView'],
    ['can_show', 'AlertModelView'],
    ['can_share_chart', 'Superset'],
    ['can_list', 'DruidClusterModelView'],
    ['can_refresh_datasources', 'Druid'],
    ['can_fetch_datasource_metadata', 'Superset'],
    ['menu_access', 'Home'],
    ['can_this_form_get', 'ExcelToDatabaseView'],
    ['can_import_dashboards', 'Superset'],
    ['can_delete', 'TableSchemaView'],
    ['menu_access', 'Plugins'],
    ['can_suggestions', 'TagView'],
    ['can_add', 'DruidMetricInlineView'],
    ['can_get', 'Datasource'],
    ['can_edit', 'DruidDatasourceModelView'],
    ['can_add', 'RoleModelView'],
    ['can_save_dash', 'Superset'],
    ['menu_access', 'Upload Excel'],
    ['can_delete', 'DruidMetricInlineView'],
    ['can_delete', 'RoleModelView'],
    ['can_validate_sql_json', 'Superset'],
    ['can_list', 'RegisterUserModelView'],
    ['can_read', 'Chart'],
    ['can_annotation_json', 'Superset'],
    ['can_list', 'AlertModelView'],
    ['can_write', 'Dashboard'],
    ['can_write', 'Log'],
    ['menu_access', 'Dashboard Email Schedules'],
    ['menu_access', 'Query Search'],
    ['can_read', 'SecurityRestApi'],
    ['can_edit', 'AccessRequestsModelView'],
    ['can_stop_query', 'Superset'],
    ['can_show', 'DruidClusterModelView'],
    ['can_delete', 'AccessRequestsModelView'],
    ['userinfoedit', 'UserOAuthModelView'],
    ['can_slice_json', 'Superset'],
    ['can_list', 'AccessRequestsModelView'],
    ['can_delete', 'SliceEmailScheduleView'],
    ['can_estimate_query_cost', 'Superset'],
    ['can_delete', 'UserOAuthModelView'],
    ['can_edit', 'DruidClusterModelView'],
    ['menu_access', 'Alerts & Report'],
    ['can_delete', 'DruidDatasourceModelView'],
    ['can_download', 'DynamicPlugin'],
    ['can_schemas', 'Superset'],
    ['can_write', 'DynamicPlugin'],
    ['muldelete', 'RowLevelSecurityFiltersModelView'],
    ['yaml_export', 'DruidClusterModelView'],
    ['can_post', 'TagView'],
    ['can_this_form_get', 'CsvToDatabaseView'],
    ['menu_access', 'Saved Queries'],
    ['can_fave_dashboards_by_username', 'Superset'],
    ['can_log', 'Superset'],
    ['can_write', 'SavedQuery'],
  ],
};

export {
  API_V1,
  MESSAGES,
  SUPERSET_ENDPOINT,
  PLUGIN_SELECTOR,
  DODOPIZZA_THEME,
  USER_ROLES,
  SUPERSET_WEBSERVER_TIMEOUT,
  DODOPIZZA_KNOWLEDGEBASE_URL,
  DODOPIZZA_ANALYTICS_URL,
  KNOWN_CERTIFICATAION_DETAILS,
};
