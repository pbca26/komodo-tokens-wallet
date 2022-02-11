import React from 'react';
import Blockchain from './blockchain';
import {secondsToString} from './time';
import {sortTransactions} from './sort';
import Jdenticon from 'react-jdenticon';
import CreateTokenModal from './CreateTokenModal';
import BatchCreateTokenModal from './BatchCreateTokenModal';
import SendTokenModal from './SendTokenModal';
import TransactionDetailsModal from './TransactionDetailsModal';
import {chains} from './constants';

const SYNC_INTERVAL = 30 * 1000;
let syncTimeoutRef;

class Dashboard extends React.Component {
  state = this.initialState;

  get initialState() {
    this.updateInput = this.updateInput.bind(this);
    this.setActiveToken = this.setActiveToken.bind(this);
    this.logout = this.logout.bind(this);

    return {
      tokenList: [],
      tokenBalance: [],
      tokenTransactions: [],
      normalUtxos: [],
      activeToken: null,
      pristine: true,
    };
  }

  getTokenData = (tokenid) => {
    const tokenInfo = this.state.tokenList.filter(tokenInfo => tokenInfo.tokenid === tokenid)[0];
    return tokenInfo;
  }

  logout() {
    clearInterval(syncTimeoutRef);
    syncTimeoutRef = null;
    Blockchain.setExplorerUrl();
    this.setState(this.initialState);
    this.props.resetApp();
  }

  setActiveToken(activeToken) {
    this.setState({
      activeToken: this.state.activeToken === activeToken ? null : activeToken,
    });
  }

  updateInput(e) {
    this.setState({
      [e.target.name]: e.target.value,
    });

    if (window.DEBUG) {
      setTimeout(() => {
        console.warn('dashboard this.state', this.state);
      }, 100);
    }
  }

  syncData = async () => {
    let cctxids = [];
    const tokenBalance = await Blockchain.tokenBalance(this.props.address.cc);
    const tokenTransactions = await Blockchain.tokenTransactions(this.props.address.cc);
    const normalUtxos = await Blockchain.getNormalUtxos(this.props.address.normal);

    for (var i = 0; i < tokenBalance.balance.length; i++) {
      if (cctxids.indexOf(tokenBalance.balance[i].tokenId) === -1) cctxids.push(tokenBalance.balance[i].tokenId);
    }
    for (var i = 0; i < tokenTransactions.txs.length; i++) {
      if (cctxids.indexOf(tokenTransactions.txs[i].tokenId) === -1) cctxids.push(tokenTransactions.txs[i].tokenId);
    }
    const tokenList = chains[this.props.chain].explorerApiVersion && chains[this.props.chain].explorerApiVersion === 2 ? await Blockchain.tokenList(cctxids) : await Blockchain.tokenList();

    this.setState({
      tokenList: tokenList.tokens,
      tokenBalance: tokenBalance.balance,
      tokenTransactions: tokenTransactions.txs,
      normalUtxos,
      pristine: false,
    });

    if (window.DEBUG) {
      setTimeout(() => {
        console.warn('data synced', this.state);
      }, 100);
    }
  }

  componentWillMount = async () => {
    syncTimeoutRef = setInterval(() => {
      this.syncData();
    }, SYNC_INTERVAL);

    this.syncData();
  }

  componentWillUnmount() {
    clearInterval(syncTimeoutRef);
  }

  getNormalBalance() {
    if (this.state.normalUtxos.length) {
      return {
        value: this.state.normalUtxos.length === 1 ? Number(this.state.normalUtxos[0].amount || 0) : Number(this.state.normalUtxos.reduce((accumulator, item) => Number(accumulator) + Number(item.amount), 0).toFixed(8)),
        satoshi: this.state.normalUtxos.length === 1 ? this.state.normalUtxos[0].satoshi || 0 : this.state.normalUtxos.reduce((accumulator, item) => Number(accumulator) + Number(item.satoshi), 0),
      };
    } else {
      return {
        value: 0,
        satoshi: 0,
      };
    }
  }

  renderTokens() {
    const balances = this.state.tokenBalance;
    let items = [];

    for (let i = 0; i < balances.length; i++) {
      items.push(
        <div
          key={`token-tile-${balances[i].tokenId}`}
          className={`token-tile${balances[i].tokenId === this.state.activeToken ? ' active' : ''}`}
          onClick={() => this.setActiveToken(balances[i].tokenId)}>
          <div className="jdenticon">
            <Jdenticon
              size="48"
              value={this.getTokenData(balances[i].tokenId).name} />
          </div>
          <strong>{this.getTokenData(balances[i].tokenId) && this.getTokenData(balances[i].tokenId).name ? this.getTokenData(balances[i].tokenId).name : balances[i].tokenId}</strong>
          <br />
          <span>{balances[i].balance}</span>
        </div>
      );
    }

    return (
      <React.Fragment>
        <h4>Current holdings</h4>
        {this.state.tokenBalance.length > 0 &&
         this.state.normalUtxos.length > 0 &&
          <SendTokenModal
            tokenList={this.state.tokenList}
            tokenBalance={this.state.tokenBalance}
            normalUtxos={this.state.normalUtxos}
            syncData={this.syncData}
            {...this.props} />
        }
        <div className="token-balance-block">
          {items}
          <CreateTokenModal
            {...this.props}
            normalUtxos={this.state.normalUtxos}
            syncData={this.syncData} />
          {window.location.href.indexOf('enable-batch-create') > -1 &&
            <BatchCreateTokenModal
              {...this.props}
              normalUtxos={this.state.normalUtxos}
              syncData={this.syncData} />
          }
        </div>
      </React.Fragment>
    );
  }

  getMaxSpendNormalUtxos() {
    const normalUtxos = this.state.normalUtxos;
    let maxSpend = -20000;

    for (let i = 0; i < normalUtxos.length; i++) {
      maxSpend += normalUtxos[i].satoshis;
    }

    return maxSpend < 0 ? 0 : maxSpend;
  };

  renderTransactions() {
    let transactions = this.state.tokenTransactions;
    let items = [];

    let transactionsMerge = [];
    for (let i = 0; i < transactions.length; i++) {
      for (let j = 0; j < transactions[i].txs.length; j++) {
        if (!this.state.activeToken || (this.state.activeToken && this.state.activeToken === transactions[i].tokenId)) {
          if (transactions[i].txs[j].height === -1 || transactions[i].txs[j].height === 0) {
            transactions[i].txs[j].height = 0;
            transactions[i].txs[j].time = Math.floor(Date.now() / 1000);
          }

          transactionsMerge.push({
            ...transactions[i].txs[j],
            tokenid: transactions[i].tokenId,
            tokenName: this.getTokenData(transactions[i].tokenId).name,
          });
        }
      }
    }
    transactions = transactionsMerge;

    transactions = sortTransactions(transactions);

    for (let i = 0; i < transactions.length; i++) {
      let directionClass = transactions[i].to === this.props.address.cc && transactions[i].to !== transactions[i].from ? 'arrow-alt-circle-down color-green' : 'arrow-alt-circle-up';

      if (transactions[i].to === transactions[i].from) directionClass = 'circle';

      if (transactions[i].type === 'coinbase') directionClass = 'gavel';

      items.push(
        <TransactionDetailsModal
          transaction={transactions[i]}
          directionClass={directionClass}
          tokenInfo={this.getTokenData(transactions[i].tokenid)}
          chainInfo={chains[this.props.chain]}
          chain={this.props.chain}
          key={`token-tile-${transactions[i].txid}-wrapper`}>
          <div
            key={`token-tile-${transactions[i].txid}`}
            className="token-transaction-item">
            <div className="transaction-left">
              <i className={`fa fa-${directionClass}`}></i>
              <div className="jdenticon">
                <Jdenticon
                  size="48"
                  value={this.getTokenData(transactions[i].tokenid).name} />
              </div>
              <div className="token-name">
                {this.getTokenData(transactions[i].tokenid).name}
                {transactions[i].height < 1 &&
                  <i
                    className="fa fa-spinner transaction-unconfirmed"
                    title="Transaction is pending confirmation"></i>
                }
              </div>
              <div className="transaction-time">
                {secondsToString(transactions[i].time)}
              </div>
            </div>
            <div className="transaction-right">
              <div className="transaction-value">{transactions[i].value} {this.getTokenData(transactions[i].tokenid).name}</div>
              <div className="transaction-address">{transactions[i].to}</div>
              <i className="fa fa-chevron-right"></i>
            </div>
          </div>
        </TransactionDetailsModal>
      );
    }

    return (
      <React.Fragment>
        <h4>Last transactions</h4>
        <div className="token-transactions-block">
          {items.length ? items : 'No transactions history'}
        </div>
      </React.Fragment>
    );
  }

  render() {
    return(
      <div className="main dashboard">
        <i
          className="fa fa-lock logout-btn"
          onClick={this.logout}></i>
        <div className="app-logo">
          <div className="box"></div>
          <div className="circle"></div>
          <img src="https://explorer.komodoplatform.com/public/img/coins/kmd.png"></img>
        </div>
        <div className="content">
          <h4>Wallet | <a onClick={this.props.setActiveView}>Marketplace</a></h4>

          <div className="address-block">
            <div>
              <strong>My Normal address:</strong> {this.props.address.normal}
              {chains[this.props.chain].faucetURL &&
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`${chains[this.props.chain].faucetURL}${this.props.address.normal}`}><i className="fa fa-faucet faucet-btn"></i></a>
              }
            </div>
            <div style={{'paddingTop': '20px'}}>
              <strong>My CC address:</strong> {this.props.address.cc}
            </div>
            <div style={{'paddingTop': '20px'}}>
              <strong>My pubkey:</strong> {this.props.address.pubkey}
            </div>
          </div>

          <div className="tokens-block">
            {this.state.normalUtxos.length > 0  &&
              <React.Fragment>
                <strong>Normal balance:</strong> {this.getNormalBalance().value} {this.props.chain}
              </React.Fragment>
            }
            {this.renderTokens()}
            {this.getMaxSpendNormalUtxos() === 0 &&
             !this.state.pristine &&
              <div>
                <strong>Please make a deposit (min of 0.00002 {this.props.chain}) to your normal address in order to create or send tokens</strong>
              </div>
            }
            {this.renderTransactions()}
          </div>
        </div>
      </div>
    );
  }
}

export default Dashboard;