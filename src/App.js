import React from 'react';
import {hot} from 'react-hot-loader';
import Login from './Login';
import './app.scss';

class App extends React.Component {
  state = this.initialState;

  get initialState() {
  }

  render() {
    return(
      <React.Fragment>
        <Login />
      </React.Fragment>
    );
  }
}

export default hot(module)(App);