import React from 'react';
import {hot} from 'react-hot-loader';
import Login from './Login';
import Dashboard from './Dashboard';
import './app.scss';

class App extends React.Component {
  state = this.initialState;

  get initialState() {
    this.setKey = this.setKey.bind(this);

    return {
      wif: '',
      address: {
        normal: '',
        cc: '',
      },
    };
  }

  setKey({wif, address}) {
    this.setState({
      wif,
      address,
    });

    setTimeout(() => {
      console.warn('app this.state', this.state);
    }, 100);
  }

  render() {
    return(
      <React.Fragment>
        {!this.state.wif &&
          <Login setKey={this.setKey} />
        }
        {this.state.wif &&
          <Dashboard
            {...this.state} />
        }
      </React.Fragment>
    );
  }
}

export default hot(module)(App);