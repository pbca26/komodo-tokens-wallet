import React from 'react';
import {hot} from 'react-hot-loader'
import {version} from '../package.json';;
import Login from './Login';
import Dashboard from './Dashboard';
import './app.scss'

window.DEBUG = false;

try {
  if (DEBUG) {
    window.DEBUG = true;
  }
} catch (e) {}

class App extends React.Component {
  state = this.initialState;

  get initialState() {
    this.setKey = this.setKey.bind(this);
    this.resetApp = this.resetApp.bind(this);

    return {
      wif: '',
      address: {
        normal: '',
        cc: '',
      },
      appVersion: null,
    };
  }

  componentWillMount() {
    document.title = `Komodo Tokens Wallet (v${version})`;
    this.setState({
      appVersion: version,
    });
  }

  resetApp() {
    this.setState(this.initialState);
  }

  setKey({wif, address}) {
    this.setState({
      wif,
      address,
    });

    if (window.DEBUG) {
      setTimeout(() => {
        console.warn('app this.state', this.state);
      }, 100);
    }
  }

  render() {
    return(
      <React.Fragment>
        {this.state.appVersion &&
          <div className="app-version">v{this.state.appVersion}</div>
        }
        {!this.state.wif &&
          <Login setKey={this.setKey} />
        }
        {this.state.wif &&
          <Dashboard
            resetApp={this.resetApp}
            {...this.state} />
        }
      </React.Fragment>
    );
  }
}

export default hot(module)(App);