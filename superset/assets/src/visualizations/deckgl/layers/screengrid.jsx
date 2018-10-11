/* eslint no-underscore-dangle: ["error", { "allow": ["", "__timestamp"] }] */

import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import { ScreenGridLayer } from 'deck.gl';

import AnimatableDeckGLContainer from '../AnimatableDeckGLContainer';

import * as common from './common';
import { getPlaySliderParams } from '../../../modules/time';
import sandboxedEval from '../../../modules/sandbox';

function getPoints(data) {
  return data.map(d => d.position);
}

function getLayer(formData, payload, slice, filters) {
  const fd = formData;
  const c = fd.color_picker;
  let data = payload.data.features.map(d => ({
    ...d,
    color: [c.r, c.g, c.b, 255 * c.a],
  }));

  if (fd.js_data_mutator) {
    // Applying user defined data mutator if defined
    const jsFnMutator = sandboxedEval(fd.js_data_mutator);
    data = jsFnMutator(data);
  }

  if (filters != null) {
    filters.forEach((f) => {
      data = data.filter(f);
    });
  }

  // Passing a layer creator function instead of a layer since the
  // layer needs to be regenerated at each render
  return new ScreenGridLayer({
    id: `screengrid-layer-${fd.slice_id}`,
    data,
    pickable: true,
    cellSizePixels: fd.grid_size,
    minColor: [c.r, c.g, c.b, 0],
    maxColor: [c.r, c.g, c.b, 255 * c.a],
    outline: false,
    getWeight: d => d.weight || 0,
    ...common.commonLayerProps(fd, slice),
  });
}

const propTypes = {
  slice: PropTypes.object.isRequired,
  payload: PropTypes.object.isRequired,
  setControlValue: PropTypes.func.isRequired,
  viewport: PropTypes.object.isRequired,
};

class DeckGLScreenGrid extends React.PureComponent {
  constructor(props) {
    super(props);

    const fd = props.slice.formData;
    const timeGrain = fd.time_grain_sqla || fd.granularity || 'PT1M';
    const timestamps = props.payload.data.features.map(f => f.__timestamp);
    const { start, end, getStep, values, disabled } = getPlaySliderParams(timestamps, timeGrain);
    this.state = { start, end, getStep, values, disabled, viewport: props.viewport };

    this.getLayers = this.getLayers.bind(this);
    this.onValuesChange = this.onValuesChange.bind(this);
    this.onViewportChange = this.onViewportChange.bind(this);
  }
  onValuesChange(values) {
    this.setState({
      values: Array.isArray(values)
        ? values
        : [values, values + this.state.getStep(values)],
    });
  }
  onViewportChange(viewport) {
    this.setState({ viewport });
  }
  getLayers(values) {
    const filters = [];

    // time filter
    if (values[0] === values[1] || values[1] === this.end) {
      filters.push(d => d.__timestamp >= values[0] && d.__timestamp <= values[1]);
    } else {
      filters.push(d => d.__timestamp >= values[0] && d.__timestamp < values[1]);
    }

    const layer = getLayer(
      this.props.slice.formData,
      this.props.payload,
      this.props.slice,
      filters);

    return [layer];
  }
  render() {
    return (
      <div>
        <AnimatableDeckGLContainer
          getLayers={this.getLayers}
          start={this.state.start}
          end={this.state.end}
          getStep={this.state.getStep}
          values={this.state.values}
          onValuesChange={this.onValuesChange}
          disabled={this.state.disabled}
          viewport={this.state.viewport}
          onViewportChange={this.onViewportChange}
          mapboxApiAccessToken={this.props.payload.data.mapboxApiKey}
          mapStyle={this.props.slice.formData.mapbox_style}
          setControlValue={this.props.setControlValue}
          aggregation
        />
      </div>
    );
  }
}

DeckGLScreenGrid.propTypes = propTypes;

function deckScreenGrid(slice, payload, setControlValue) {
  const fd = slice.formData;
  let viewport = {
    ...fd.viewport,
    width: slice.width(),
    height: slice.height(),
  };

  if (fd.autozoom) {
    viewport = common.fitViewport(viewport, getPoints(payload.data.features));
  }

  ReactDOM.render(
    <DeckGLScreenGrid
      slice={slice}
      payload={payload}
      setControlValue={setControlValue}
      viewport={viewport}
    />,
    document.getElementById(slice.containerId),
  );
}

module.exports = {
  default: deckScreenGrid,
  getLayer,
};
