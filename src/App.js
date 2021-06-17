import React from 'react';
import {hot} from 'react-hot-loader';

class App extends React.Component {
  state = this.initialState;

  get initialState() {
  }

  render() {
    return(
      <React.Fragment>
      </React.Fragment>
    );
  }
}

export default hot(module)(App);