import React from 'react';
import Modal from './Modal';
import TokensLib from './cclib-import';
import Blockchain from './blockchain';
import {chains} from './constants';
import {utxoSelectCC, utxoSelectNormal} from './utxo-select';
import {toSats} from './math';
import {getMaxSpendNormalUtxos} from './math';
import writeLog from './log';
import devVars from './dev'

class FillAskTokenModal extends React.Component {
  state = this.initialState;
  
  get initialState() {
    this.updateInput = this.updateInput.bind(this);

    return {
      isClosed: true,
      amount: devVars && devVars.fill.amountAsk || '',
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

    setTimeout(() => {
      writeLog('login this.state', this.state);
    }, 100);
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
    const {chain, address, order} = this.props;
    
    if (Number(this.state.amount) > order.askamount ||
        Number(this.state.amount) < 1) {
      this.setState({
        success: null,
        txid: null,
        error: order.totalrequired === 1 ? 'Amount must be equal to 1' : 'Amount must be between 1 and ' + order.askamount,
      });
    } else if (toSats(order.price * this.state.amount) > getMaxSpendNormalUtxos(this.props.normalUtxos)) {
      this.setState({
        success: null,
        txid: null,
        error: 'Not enough balance',
      });
    } else {
      try {
        let inputsData, rawtx;
        writeLog('fillaskToken');
        writeLog(TokensLib.V2Assets)

        inputsData = {
          transactionsMany: await Blockchain.tokenTransactionsMany(
            order.tokenid,
            order.txid
          ),
          normalUtxos: await Blockchain.createCCTx(
            toSats(order.price * this.state.amount) + 10000,
            address.pubkey
          ),
        };

        writeLog('fillaskToken inputs data', inputsData);

        try {
          rawtx = await TokensLib.V2Assets.buildTokenv2fillask(
            order.tokenid,
            order.txid,
            Number(this.state.amount),
            order.price,
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
    
        writeLog('fillaskToken token rawtx', rawtx);
    
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
          className={`fill-ask-order-trigger ${maxNormalSpendValue === 0 ? ' disabled' : ''}`}
          onClick={() => this.open()}>
          <i className="fa fa-dollar-sign"></i>
          Buy
        </div>
        <Modal
          show={this.state.isClosed === false}
          handleClose={() => this.close()}
          isCloseable={true}
          className="Modal-send-token">
          <div className="create-token-form">
            <h4>Buy token</h4>
            <p>Fill out the form below</p>
            <div className="input-form">
              <input
                type="text"
                name="token"
                value={`Token: ${tokenInfo.name}`}
                disabled
                className="form-input" />
              <input
                type="text"
                name="amount"
                placeholder="Amount (qty)"
                value={this.state.amount}
                onChange={this.updateInput}
                className="form-input" />
              <input
                type="text"
                name="token"
                value={`Price: ${order.price}`}
                disabled
                className="form-input" />
              <input
                type="text"
                name="token"
                value={`Total: ${(this.state.amount || 0) * order.price}`}
                disabled
                className="form-input" />
              <button
                type="button"
                onClick={this.buyToken}
                disabled={
                  !this.state.amount ||
                  maxNormalSpendValue === 0
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