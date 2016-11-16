import React from 'react';
import Gravatar from 'react-gravatar';
import moment from 'moment';
import { Panel } from 'react-bootstrap';

const propTypes = {
  user: React.PropTypes.object.isRequired,
};
const UserInfo = ({ user }) => (
  <div>
    <a href="https://en.gravatar.com/">
      <Gravatar
        email={user.email}
        width="100%"
        height=""
        alt="Profile picture provided by Gravatar"
        className="img-rounded"
        style={{ borderRadius: 15 }}
      />
    </a>
    <hr />
    <Panel>
      <h3>
        <strong>{user.firstName} {user.lastName}</strong>
      </h3>
      <h4>
        <i className="fa fa-user-o" /> {user.username}
      </h4>
      <hr />
      <p>
        <i className="fa fa-clock-o" /> joined {moment(user.createdOn, 'YYYYMMDD').fromNow()}
      </p>
      <p>
        <i className="fa fa-envelope-o" /> {user.email}
      </p>
      <p>
        <i className="fa fa-lock" /> {Object.keys(user.roles).join(', ')}
      </p>
      <p>
        <i className="fa fa-key" /> <span className="text-muted">id:</span> {user.userId}
      </p>
    </Panel>
  </div>
);
UserInfo.propTypes = propTypes;
export default UserInfo;
