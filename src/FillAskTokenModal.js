import React from 'react';
import Modal from './Modal';
import TokensLib from './cclib-import';
import Blockchain from './blockchain';
import {chains} from './constants';
import {utxoSelectCC, utxoSelectNormal} from './utxo-select';
import {toSats} from './math';

class FillAskTokenModal extends React.Component {
  state = this.initialState;
  
  get initialState() {
    this.updateInput = this.updateInput.bind(this);

    return {
      isClosed: true,
      amount: 1,
      success: null,
      txid: null,
      error: null,
    };
  }

  updateInput(e) {
    if (e.target.name === 'amount') {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    }
    
    this.setState({
      [e.target.name]: e.target.value,
      error: null,
      success: null,
      txid: null,
    });

    if (window.DEBUG) {
      setTimeout(() => {
        console.warn('login this.state', this.state);
      }, 100);
    }
  }

  close() {
    this.setState({
      ...this.initialState,
      isClosed: true
    });
  }

  open() {
    this.setState({
      ...this.initialState,
      isClosed: false
    });
  }

  buyToken = async () => {
    if (Number(this.state.amount) > this.props.order.askamount || Number(this.state.amount) < 1) {
      this.setState({
        success: null,
        txid: null,
        error: this.props.order.totalrequired === 1 ? 'Amount must be equal to 1' : 'Amount must be between 1 and ' + this.props.order.askamount,
      });
    } else {
      try {
        let inputsData, rawtx;
        console.warn('fillaskToken');
        console.warn(TokensLib.V2Assets)

        inputsData = {
          transactionsMany: await Blockchain.tokenTransactionsMany(this.props.order.tokenid, this.props.order.txid),
          normalUtxos: await Blockchain.createCCTx(toSats(this.props.order.price * this.state.amount) + 10000, this.props.address.pubkey),
        };

        console.warn('fillaskToken inputs data', inputsData);

        try {
          rawtx = await TokensLib.V2Assets.buildTokenv2fillask(
            this.props.order.tokenid,
            this.props.order.txid,
            Number(this.state.amount),
            this.props.order.price,
            this.props.wif,
            inputsData,
          );
        } catch (e) {
          console.warn(e);
          this.setState({
            success: null,
            txid: null,
            error: e.message,
          });
        }
    
        if (window.DEBUG) {
          console.warn('fillaskToken token rawtx', rawtx);
        }
    
        if (rawtx && rawtx.substr(0, 2) === '04') {
          const {txid} = await Blockchain.broadcast(rawtx);
    
          if (!txid || txid.length !== 64) {
            this.setState({
              success: null,
              txid: null,
              error: 'Unable to broadcast transaction!',
            });
          } else {
            this.setState({
              success: `${chains[this.props.chain].explorerUrl}/${this.props.order.tokenid}/transactions/${txid}/${this.props.chain}`,
              txid,
              error: null,
              price: '',
              token: null,
              amount: '',
              tokenDropdownOpen: false,
            });
            //this.props.setActiveToken();
            setTimeout(() => {
              this.props.syncData();
            }, 100);
          }
        } else {
          this.setState({
            success: null,
            txid: null,
            error: 'Unable to build transaction!',
          });
        }
      } catch (e) {
        this.setState({
          success: null,
          txid: null,
          error: e.message,
        });
      }
    }
  }

  getMaxSpendNormalUtxos() {
    const normalUtxos = this.props.normalUtxos;
    let maxSpend = -10000;

    for (let i = 0; i < normalUtxos.length; i++) {
      maxSpend += normalUtxos[i].satoshis;
    }

    return maxSpend < 0 ? 0 : maxSpend;
  };

  render() {
    const getTokenData = (tokenid) => {
      const tokenInfo = this.props.tokenList.filter(tokenInfo => tokenInfo.tokenid === tokenid)[0];
      return tokenInfo;
    }

    return (
      <React.Fragment>
        <div
          className={`fill-ask-order-trigger ${this.getMaxSpendNormalUtxos() === 0 ? ' disabled' : ''}`}
          onClick={() => this.open()}>
          <i className="fa fa-dollar-sign"></i>
          Sell
        </div>
        <Modal
          show={this.state.isClosed === false}
          handleClose={() => this.close()}
          isCloseable={true}
          className="Modal-send-token">
          <div className="create-token-form">
            <h4>Sell token</h4>
            <p>Fill out the form below</p>
            <div className="input-form">
              <input
                type="text"
                name="token"
                value={`Token: ${getTokenData(this.props.order.tokenid).name}`}
                disabled
                className="form-input" / >
              <input
                type="text"
                name="amount"
                placeholder="Amount (qty)"
                value={this.state.amount}
                onChange={this.updateInput}
                className="form-input" / >
              <input
                type="text"
                name="token"
                value={`Price: ${this.props.order.price}`}
                disabled
                className="form-input" / >
              <input
                type="text"
                name="token"
                value={`Total: ${(this.state.amount || 0) * this.props.order.price}`}
                disabled
                className="form-input" / >
              <button
                type="button"
                onClick={this.buyToken}
                disabled={
                  !this.state.amount ||
                  this.getMaxSpendNormalUtxos() === 0
                }
                className="form-input">Buy</button>
              {this.state.success &&
                <div className="success">
                  Token buy order filled!
                  <div className="txid-label">
                    <strong>Transaction ID:</strong> {this.state.txid}
                  </div>
                  <a
                    href={this.state.success}
                    target="_blank">Open on explorer</a>
                </div>
              }
              {this.state.error &&
                <div className="error">
                  <div>
                    <strong>Error!</strong>
                    <div>{this.state.error}</div>
                  </div>
                </div>
              }
            </div>
          </div>
        </Modal>
      </React.Fragment>
    );
  }
}

export default FillAskTokenModal;