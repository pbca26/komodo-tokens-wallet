import React from 'react';
import {hot} from 'react-hot-loader';
import {version} from '../package.json';
import Login from './Login';
import Dashboard from './Dashboard';
import Marketplace from './Marketplace';
import './debug-util';
import './app.scss';
import './logo.scss';
import './input.scss';
import './order-info.scss';
import './transactions.scss';
import './balance.scss';
import './marketplace.scss';

class App extends React.Component {
  state = this.initialState;

  get initialState() {
    this.setKey = this.setKey.bind(this);
    this.resetApp = this.resetApp.bind(this);
    this.setActiveView = this.setActiveView.bind(this);

    return {
      wif: '',
      address: {
        normal: '',
        cc: '',
      },
      chain: null,
      appVersion: null,
      walletView: true,
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

  setKey({wif, address, chain}) {
    this.setState({
      wif,
      address,
      chain,
    });

    if (window.DEBUG) {
      setTimeout(() => {
        console.warn('app this.state', this.state);
      }, 100);
    }
  }

  setActiveView() {
    this.setState({
      walletView: !this.state.walletView,
    });
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
          <React.Fragment>
            {this.state.walletView &&
              <Dashboard
                resetApp={this.resetApp}
                setActiveView={this.setActiveView}
                {...this.state} />
            }
            {!this.state.walletView &&
              <Marketplace
                resetApp={this.resetApp}
                setActiveView={this.setActiveView}
                {...this.state} />
            }
          </React.Fragment>
        }
      </React.Fragment>
    );
  }
}

export default hot(module)(App);