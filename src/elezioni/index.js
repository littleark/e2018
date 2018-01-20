import React, { Component } from 'react';
import ElezioniContainer from './containers/ElezioniContainer'
import './elezioni.css';

class Elezioni extends Component {
  render() {
    return (
      <div className="elezioni">
        <ElezioniContainer />
      </div>
    );
  }
}

export default Elezioni;
