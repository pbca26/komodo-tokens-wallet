import React from 'react';
import Modal from './Modal';
import TokensLib from './cclib-import';
import Blockchain from './blockchain';
import {chains} from './constants';
import {utxoSelectCC, utxoSelectNormal} from './utxo-select';
import {toSats} from './math';

class CancelBidTokenModal extends React.Component {
  state = this.initialState;
  
  get initialState() {
    return {
      isClosed: true,
      success: null,
      txid: null,
      error: null,
    };
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

  cancelBuyTokenOrder = async () => {
    try {
      let inputsData, rawtx;
      console.warn('cancelBidTokenOrder');
      console.warn(TokensLib.V2Assets)

      inputsData = {
        transactionsMany: await Blockchain.tokenTransactionsMany(this.props.order.tokenid, this.props.order.txid),
        normalUtxos: await Blockchain.createCCTx(10000, this.props.address.pubkey),
      };

      console.warn('cancelBidTokenOrder inputs data', inputsData);
      console.warn('send tx modal inputsData', JSON.stringify(inputsData));
      console.warn(this.state);
      try {
        rawtx = await TokensLib.V2Assets.buildTokenv2cancelbid(
          this.props.order.tokenid,
          this.props.order.txid,
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
        console.warn('cancelBidTokenOrder token rawtx', rawtx);
      }
  
      if (rawtx && rawtx.substr(0, 2) === '04') {
        //const {txid} = await Blockchain.broadcast(rawtx);
  
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
          className={`${this.getMaxSpendNormalUtxos() === 0 ? ' disabled' : ''}`}
          onClick={() => this.open()}>
          {this.props.children}
        </div>
        <Modal
          show={this.state.isClosed === false}
          handleClose={() => this.close()}
          isCloseable={true}
          className="Modal-send-token">
          <div className="create-token-form">
            <h4>Cancel Buy token order</h4>
            <div className="input-form">
              <input
                type="text"
                name="token"
                value={`Token: ${getTokenData(this.props.order.tokenid).name}`}
                disabled
                className="form-input" / >
              <input
                type="text"
                name="token"
                value={`Order size: ${this.props.order.totalrequired}`}
                disabled
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
                value={`Total: ${(this.props.order.totalrequired || 0) * this.props.order.price}`}
                disabled
                className="form-input" / >
              <button
                type="button"
                onClick={this.cancelBuyTokenOrder}
                disabled={
                  this.getMaxSpendNormalUtxos() === 0
                }
                className="form-input">Cancel</button>
              {this.state.success &&
                <div className="success">
                  Token buy order cancelled!
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

export default CancelBidTokenModal;