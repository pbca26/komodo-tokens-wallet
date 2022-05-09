import React from 'react';
import Modal from './Modal';
import TokensLib from './cclib-import';
import Blockchain from './blockchain';
import {chains} from './constants';
import {utxoSelectCC, utxoSelectNormal} from './utxo-select';
import {toSats} from './math';
import {getMaxSpendNormalUtxos} from './math';
import writeLog from './log';

class CancelAskTokenModal extends React.Component {
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

  cancelSellTokenOrder = async () => {
    const {chain, address, order} = this.props;
    
    try {
      let inputsData, rawtx;
      writeLog('cancelSellTokenOrder');
      writeLog(TokensLib.V2Assets);

      inputsData = {
        transactionsMany: await Blockchain.tokenTransactionsMany(order.tokenid, order.txid),
        normalUtxos: await Blockchain.createCCTx(10000, address.pubkey),
      };

      writeLog('cancelSellTokenOrder inputs data', inputsData);
      writeLog('send tx modal inputsData', JSON.stringify(inputsData));
      writeLog(this.state);
      
      try {
        rawtx = await TokensLib.V2Assets.buildTokenv2cancelask(
          order.tokenid,
          order.txid,
          this.props.wif,
          inputsData,
        );
      } catch (e) {
        writeLog(e);
        this.setState({
          success: null,
          txid: null,
          error: e.message,
        });
      }
  
      writeLog('cancelSellTokenOrder token rawtx', rawtx);
  
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
            success: `${chains[chain].explorerUrl}/${order.tokenid}/transactions/${txid}/${chain}`,
            txid,
            error: null,
            price: '',
            token: null,
            amount: '',
            tokenDropdownOpen: false,
          });
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

  getTokenData(tokenid) {
    const tokenInfo = this.props.tokenList.filter(tokenInfo => tokenInfo.tokenid === tokenid)[0];
    return tokenInfo;
  }

  render() {
    const tokenInfo = this.getTokenData(this.props.order.tokenid);
    const maxNormalSpendValue = getMaxSpendNormalUtxos(this.props.normalUtxos);
    const {order} = this.props;
    
    return (
      <React.Fragment>
        <div
          className={`${maxNormalSpendValue === 0 ? ' disabled' : ''}`}
          onClick={() => this.open()}>
          {this.props.children}
        </div>
        <Modal
          show={this.state.isClosed === false}
          handleClose={() => this.close()}
          isCloseable={true}
          className="Modal-send-token">
          <div className="create-token-form">
            <h4>Cancel Sell token order</h4>
            <div className="input-form">
              <input
                type="text"
                name="token"
                value={`Token: ${tokenInfo.name}`}
                disabled
                className="form-input" / >
              <input
                type="text"
                name="token"
                value={`Order size: ${order.askamount}`}
                disabled
                className="form-input" / >
              <input
                type="text"
                name="token"
                value={`Price: ${order.price}`}
                disabled
                className="form-input" / >
              <input
                type="text"
                name="token"
                value={`Total: ${(order.askamount || 0) * order.price}`}
                disabled
                className="form-input" / >
              <button
                type="button"
                onClick={this.cancelSellTokenOrder}
                disabled={maxNormalSpendValue === 0}
                className="form-input">Cancel</button>
              {this.state.success &&
                <div className="success">
                  Token sell order cancelled!
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

export default CancelAskTokenModal;