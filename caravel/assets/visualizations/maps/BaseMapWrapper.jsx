import React from 'react';
import MapGL from 'react-map-gl';

const BaseMapWrapper = ComposedComponent => {
  const DEFAULT_POINT_RADIUS = 60;
  const DEFAULT_LONGITUDE = -122.405293;
  const DEFAULT_LATITUDE = 37.772123;
  const DEFAULT_ZOOM = 11;
  const propTypes = {
    slice: React.PropTypes.object.isRequired
  };

  class BaseMap extends React.Component {
    constructor(props) {
      super(props);

      this.onChangeViewport = this.onChangeViewport.bind(this);
      this.sliceLoaded = false;
    }

    componentDidMount() {
      this.sliceRequest = $.ajax({
        context: this,
        type: "GET",
        url: this.props.slice.jsonEndpoint(),
        success: function (json) {
          this.sliceLoaded = true;

          const longitude = json.data.viewportLongitude || DEFAULT_LONGITUDE;
          const latitude = json.data.viewportLatitude || DEFAULT_LATITUDE;

          this.setState($.extend(
            {
              width: this.props.slice.width(),
              height: this.props.slice.height(),
              viewport: {
                longitude: longitude,
                latitude: latitude,
                zoom: this.props.viewportZoom || DEFAULT_ZOOM,
                startDragLngLat: [longitude, latitude]
              },
              pointRadius: DEFAULT_POINT_RADIUS
            },
            json.data
          ));

          this.props.slice.done(json);
        },
        error: function () {
          this.props.slice.error(error.responseText);
          return '';
        }
      });
    }

    componentWillUnmount() {
      this.sliceRequest.abort();
    }

    onChangeViewport(viewport) {
      this.setState({
        viewport: viewport
      });
    }

    render() {
      if (!this.sliceLoaded) {
        return null;
      }

      d3.select('#viewport_longitude').attr('value', this.state.viewport.longitude);
      d3.select('#viewport_latitude').attr('value', this.state.viewport.latitude);
      d3.select('#viewport_zoom').attr('value', this.state.viewport.zoom);

      return (
        <MapGL
          {...this.state.viewport}
          mapStyle={this.state.mapStyle}
          width={this.state.width}
          height={this.state.height}
          mapboxApiAccessToken={this.state.mapboxApiKey}
          onChangeViewport={this.onChangeViewport}>
          <ComposedComponent
            {...this.state}
            isDragging={this.state.viewport.isDragging === undefined ? false :
                        this.state.viewport.isDragging}
          />
        </MapGL>
      );
    }
  }

  BaseMap.propTypes = propTypes;

  return BaseMap;
};

export default BaseMapWrapper;
