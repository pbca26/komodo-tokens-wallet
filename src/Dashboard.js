import React from 'react';
import TokensLib from './tokenslib.js';
import Blockchain from './blockchain';
import {coin, explorerApiUrl, explorerUrl} from './constants';

const SYNC_INTERVAL = 30 * 1000;
let syncTimeoutRef;

class Dashboard extends React.Component {
  state = this.initialState;

  get initialState() {
    this.updateInput = this.updateInput.bind(this);

    return {
      tokenList: [],
      tokenBalance: [],
      normalUtxos: [],
    };
  }

  updateInput(e) {
    this.setState({
      [e.target.name]: e.target.value,
    });

    setTimeout(() => {
      console.warn('dashboard this.state', this.state);
    }, 100);
  }

  syncData = async () => {
    Blockchain.setExplorerUrl(explorerApiUrl);
    
    const tokenList = await Blockchain.tokenList();
    const tokenBalance = await Blockchain.tokenBalance(this.props.address.cc);
    const normalUtxos = await Blockchain.getNormalUtxos(this.props.address.normal);

    this.setState({
      tokenList: tokenList.tokens,
      tokenBalance: tokenBalance.balance,
      normalUtxos,
    });

    setTimeout(() => {
      console.warn('data synced', this.state);
    }, 100);
  }

  componentWillMount = async () => {
    syncTimeoutRef = setInterval(() => {
      this.syncData();
    }, SYNC_INTERVAL);

    this.syncData();
  }

  getNormalBalance() {
    if (this.state.normalUtxos.length) {
      return {
        value: this.state.normalUtxos.length === 1 ? this.state.normalUtxos[0].amount : this.state.normalUtxos.reduce((accumulator, item) => accumulator.amount + item.amount),
        satoshi: this.state.normalUtxos.length === 1 ? this.state.normalUtxos[0].satoshi : this.state.normalUtxos.reduce((accumulator, item) => accumulator.satoshi + item.satoshi),
      };
    } else {
      return {
        value: 0,
        satoshi: 0,
      };
    }
  }

  render() {
    return(
      <div className="main">
        <div className="content">
          <h4>Dashboard</h4>
          <div>
            <div>
              <strong>My Normal address:</strong> {this.props.address.normal}
            </div>
            <div style={{'paddingTop': '20px'}}>
              <strong>My CC address:</strong> {this.props.address.cc}
              <div style={{'paddingTop': '3px', 'paddingBottom': '15px'}}>
                <a
                  href={`${explorerUrl}/address/${this.props.address.cc}/${coin}`}
                  target="_blank">Check balances</a>
              </div>
            </div>
          </div>
          <div>
            {this.state.normalUtxos.length > 0  &&
              <React.Fragment>
                <strong>Normal balance:</strong> {this.getNormalBalance().value} {coin}
              </React.Fragment>
            }
            {!this.state.normalUtxos.length &&
              <div style={{'paddingTop': '20px'}}>Please make a deposit to your normal address in order to create new token</div>
            }
          </div>
        </div>
      </div>
    );
  }
}

export default Dashboard;