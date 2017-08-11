export const slice = {
  token: 'token_089ec8c1',
  csv_endpoint: '',
  edit_url: '/slicemodelview/edit/39',
  viz_name: 'filter_box',
  json_endpoint: '',
  slice_id: 39,
  standalone_endpoint: '',
  description_markeddown: '',
  form_data: {
    collapsed_fieldsets: null,
    time_grain_sqla: 'Time Column',
    granularity_sqla: 'year',
    standalone: null,
    date_filter: false,
    until: '2014-01-02',
    extra_filters: null,
    force: null,
    where: '',
    since: '2014-01-01',
    async: null,
    slice_id: null,
    json: null,
    having: '',
    flt_op_2: 'in',
    previous_viz_type: 'filter_box',
    groupby: [
      'region',
      'country_name',
    ],
    flt_col_7: '',
    slice_name: null,
    viz_type: 'filter_box',
    metric: 'sum__SP_POP_TOTL',
    flt_col_8: '',
  },
  slice_url: '',
  slice_name: 'Region Filter',
  description: null,
  column_formats: {},
};
export const dashboardData = {
  css: '',
  metadata: {
    filter_immune_slices: [],
    timed_refresh_immune_slices: [],
    filter_immune_slice_fields: {},
    expanded_slices: {},
  },
  slug: 'births',
  position_json: [
    {
      size_x: 2,
      slice_id: '52',
      row: 0,
      size_y: 2,
      col: 1,
    },
  ],
  id: 2,
  slices: [slice],
  sliceObjects: [slice],
  dashboard_title: 'Births',
  readFilters: () => {},
  onChange: () => {},
};

export const contextData = {
  dash_save_perm: true,
  standalone_mode: false,
  dash_edit_perm: true,
  user_id: '1',
};
