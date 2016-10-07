import React from 'react';
import { bindActionCreators } from 'redux';
import * as actions from '../actions/exploreActions';
import { connect } from 'react-redux';

const propTypes = {
  actions: React.PropTypes.object,
};

class SqlClause extends React.Component {
  changeWhere(event) {
    this.props.actions.setWhereClause(event.target.value);
  }
  changeHaving(event) {
    this.props.actions.setHavingClause(event.target.value);
  }
  render() {
    return (
      <div className="panel space-1">
        <div className="panel-header">SQL</div>
        <div className="panel-body">
          <div className="row">
            <h5 className="section-heading">Where</h5>
            <input
              type="text"
              onChange={this.changeWhere.bind(this)}
              className="form-control input-sm"
              placeholder="Where Clause"
            />
          </div>
          <div className="row">
            <h5 className="section-heading">Having</h5>
            <input
              type="text"
              onChange={this.changeHaving.bind(this)}
              className="form-control input-sm"
              placeholder="Having Clause"
            />
          </div>
        </div>
      </div>
    );
  }
}

SqlClause.propTypes = propTypes;

function mapStateToProps() {
  return {};
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(actions, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SqlClause);
