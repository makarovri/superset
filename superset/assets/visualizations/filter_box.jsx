// JS
import d3 from 'd3';
import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import Select from 'react-select';
import { Button } from 'react-bootstrap';

import { dashboardContainer } from '../javascripts/dashboard/Dashboard.jsx'
import '../stylesheets/react-select/select.less';
import { TIME_CHOICES } from './constants';
import './filter_box.css';

const propTypes = {
  filtersChoices: PropTypes.object,
  onChange: PropTypes.func,
  showDateFilter: PropTypes.bool,
  datasource: PropTypes.object.isRequired,
  showLabel: PropTypes.bool,
  showMetricNumber: PropTypes.bool,
  origSelectedValues: PropTypes.object,
  instantFiltering: PropTypes.bool,
  sliceId: PropTypes.number,
};

const defaultProps = {
  onChange: () => {},
  showDateFilter: false,
  showLabel: true,
  showMetricNumber: false,
  origSelectedValues: {},
  instantFiltering: true,
  sliceId: -1,
};

class FilterBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedValues: props.origSelectedValues,
      hasChanged: false,
    };
  }
  clickApply() {
    this.props.onChange(Object.keys(this.state.selectedValues)[0], [], true, true);
    this.setState({ hasChanged: false });
  }
  changeFilter(filter, options) {
    /*if (dashboardData.metadata.filter_immune_slice_fields[this.props.sliceId]) {
      dashboardData.metadata.filter_immune_slice_fields[this.props.sliceId].push(filter);
    } else {
      dashboardData.metadata.filter_immune_slice_fields[this.props.sliceId] = [filter];
    }
    console.log('[filter_box.jsx] dashboardData.metadata: ');
    console.log(dashboardData.metadata);*/
    console.log('filter: ' + filter);
    console.log('sliceId: ' + this.props.sliceId);
    let vals = null;
    if (options) {
      if (Array.isArray(options)) {
        vals = options.map(opt => opt.value);
      } else {
        vals = options.value;
      }
    }
    const selectedValues = Object.assign({}, this.state.selectedValues);
    selectedValues[filter] = vals;
    this.setState({ selectedValues, hasChanged: true });
    this.props.onChange(filter, vals, false, this.props.instantFiltering);
  }
  render() {
    let dateFilter;
    if (this.props.showDateFilter) {
      dateFilter = ['__from', '__to'].map((field) => {
        const val = this.state.selectedValues[field];
        const choices = TIME_CHOICES.slice();
        if (!choices.includes(val)) {
          choices.push(val);
        }
        const options = choices.map(s => ({ value: s, label: s }));
        return (
          <div className="m-b-5" key={field}>
            {field.replace('__', '')}
            <Select.Creatable
              options={options}
              value={this.state.selectedValues[field]}
              onChange={this.changeFilter.bind(this, field)}
            />
          </div>
        );
      });
    }
    const filters = Object.keys(this.props.filtersChoices).map((filter) => {
      const data = this.props.filtersChoices[filter];
      const maxes = {};
      maxes[filter] = d3.max(data, function (d) {
        return d.metric;
      });
      return (
        <div key={filter} className="m-b-5">
          {this.props.showLabel && (this.props.datasource.verbose_map[filter] || filter)}
          <Select.Creatable
            placeholder={`Select [${filter}]`}
            key={filter}
            multi
            value={this.state.selectedValues[filter]}
            options={data.map((opt) => {
              const perc = Math.round((opt.metric / maxes[opt.filter]) * 100);
              const backgroundImage = (
                'linear-gradient(to right, lightgrey, ' +
                `lightgrey ${perc}%, rgba(0,0,0,0) ${perc}%`
              );
              const style = {
                backgroundImage,
                padding: '2px 5px',
              };
              let label_;
              if (this.props.showMetricNumber) {
                label_ = opt.id.concat(" [", opt.metric, "]");
              } else {
                label_ = opt.id;
              }
              return { value: opt.id, label: label_, style };
            })}
            onChange={this.changeFilter.bind(this, filter)}
          />
        </div>
      );
    });
    return (
      <div>
        {dateFilter}
        {filters}
        {!this.props.instantFiltering &&
          <Button
            bsSize="small"
            bsStyle="primary"
            onClick={this.clickApply.bind(this)}
            disabled={!this.state.hasChanged}
          >
            Apply
          </Button>
        }
      </div>
    );
  }
}
FilterBox.propTypes = propTypes;
FilterBox.defaultProps = defaultProps;

function filterBox(slice, payload) {
  const d3token = d3.select(slice.selector);
  d3token.selectAll('*').remove();

  // filter box should ignore the dashboard's filters
  // const url = slice.jsonEndpoint({ extraFilters: false });
  const fd = slice.formData;
  const sliceId = slice.data.slice_id;
  const filtersChoices = {};
  // Making sure the ordering of the fields matches the setting in the
  // dropdown as it may have been shuffled while serialized to json
  fd.groupby.forEach((f) => {
    filtersChoices[f] = payload.data[f];
  });
  ReactDOM.render(
    <FilterBox
      filtersChoices={filtersChoices}
      onChange={slice.addFilter}
      showDateFilter={fd.date_filter}
      datasource={slice.datasource}
      showLabel={fd.filter_label}
      showMetricNumber={fd.display_metric}
      origSelectedValues={slice.getFilters() || {}}
      instantFiltering={fd.instant_filtering}
      sliceId={sliceId}
    />,
    document.getElementById(slice.containerId),
  );
}

module.exports = filterBox;
