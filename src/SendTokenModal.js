import React from 'react';
import Modal from './Modal';
import TokensLib from './tokenslib.js';
import Blockchain from './blockchain';
import {coin, explorerApiUrl, explorerUrl, txBuilderApi} from './constants';

class SendTokenModal extends React.Component {
  state = this.initialState;
  
  get initialState() {
    this.updateInput = this.updateInput.bind(this);
    this.dropdownTrigger = this.dropdownTrigger.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.setToken = this.setToken.bind(this);

    return {
      isClosed: true,
      token: null,
      pubkey: '',
      amount: '',
      success: null,
      txid: null,
      error: null,
      tokenDropdownOpen: false,
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

  setToken(token) {
    this.setState({
      token,
    });
  }

  sendToken = async () => {
    if (Number(this.state.amount) > this.state.token.balance || Number(this.state.amount) < 1) {
      this.setState({
        success: null,
        txid: null,
        error: 'Amount must be between 1 and ' + this.state.token.balance,
      });
    } else {
      try {
        let inputsData = {
          ccUtxos: txBuilderApi === 'default' ? await TokensLib.AddTokensInputsRemote(
            this.state.token.tokenId, this.props.address.pubkey, Number(this.state.amount)
          ) : await Blockchain.addCCInputs(this.state.token.tokenId, this.props.address.pubkey, Number(this.state.amount)),
          normalUtxos: txBuilderApi === 'default' ? await TokensLib.createTxAndAddNormalInputs(10000, this.props.address.pubkey) : await Blockchain.createCCTx(10000, this.props.address.pubkey),
        },
        rawtx;

        if (window.DEBUG) {
          console.warn('send tx modal inputsData', inputsData);
        }

        try {
          rawtx = await TokensLib.transferTokenTx(
            this.state.token.tokenId, this.state.pubkey, Number(this.state.amount), this.props.wif, inputsData
          );
        } catch (e) {
          this.setState({
            success: null,
            txid: null,
            error: e.message,
          });
        }
    
        if (window.DEBUG) {
          console.warn('send token rawtx', rawtx);
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
              success: `${explorerUrl}/${this.state.token.tokenId}/transactions/${txid}/${coin}`,
              txid,
              error: null,
              pubkey: '',
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

  dropdownTrigger(e) {
    e.stopPropagation();

    this.setState({
      tokenDropdownOpen: !this.state.tokenDropdownOpen,
    });
  }

  componentWillMount() {
    document.addEventListener(
      'click',
      this.handleClickOutside,
      false
    );
  }

  componentWillUnmount() {
    document.removeEventListener(
      'click',
      this.handleClickOutside,
      false
    );
  }

  handleClickOutside(e) {
    const srcElement = e ? e.srcElement : null;
    let state = {};

    if (e &&
        srcElement &&
        srcElement.className &&
        typeof srcElement.className === 'string' &&
        srcElement.className !== 'token-tile send-token-trigger') {
      this.setState({
        tokenDropdownOpen: false,
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
          className={`token-tile send-token-trigger${this.getMaxSpendNormalUtxos() === 0 ? ' disabled' : ''}`}
          onClick={() => this.open()}>
          <i className="fa fa-paper-plane"></i>
          Send
        </div>
        <Modal
          show={this.state.isClosed === false}
          handleClose={() => this.close()}
          isCloseable={true}
          className="Modal-send-token">
          <div className="create-token-form">
            <h4>Send token</h4>
            <p>Fill out the form below</p>
            <div className="input-form">
              <div className={`dropdown${this.state.tokenDropdownOpen ? ' is-active' : ''}`}>
                <div className={`dropdown-trigger${this.state.token ? ' highlight' : ''}`}>
                  <button
                    className="button"
                    onClick={this.dropdownTrigger}>
                    <span>{this.state.token && this.state.token.name ? this.state.token.name : 'Select token'}</span>
                    {this.state.token &&
                      <span className="dropdown-balance">{this.state.token.balance}</span>
                    }
                    <span className="icon is-small">
                      <i className="fas fa-angle-down"></i>
                    </span>
                  </button>
                </div>
                <div
                  className="dropdown-menu"
                  id="dropdown-menu"
                  role="menu">
                  <div className="dropdown-content">
                    {this.props.tokenBalance.map(tokenBalanceItem => (
                      <a
                        key={`send-token-${tokenBalanceItem.tokenId}`}
                        className={`dropdown-item${getTokenData(tokenBalanceItem.tokenId).height === -1 ? ' disabled' : ''}`}
                        title={getTokenData(tokenBalanceItem.tokenId).height === -1 ? `Pending confirmation` : ''}
                        onClick={getTokenData(tokenBalanceItem.tokenId).height === -1 ? null : () => this.setToken({
                          balance: tokenBalanceItem.balance,
                          tokenId: tokenBalanceItem.tokenId,
                          name: getTokenData(tokenBalanceItem.tokenId).name
                        })}>
                        {getTokenData(tokenBalanceItem.tokenId).name}
                        {getTokenData(tokenBalanceItem.tokenId).height > 0 &&
                          <span className="dropdown-balance">{tokenBalanceItem.balance}</span>
                        }
                        {getTokenData(tokenBalanceItem.tokenId).height === -1 &&
                          <i className="fa fa-spinner"></i>
                        }
                      </a>
                    ))}
                  </div>
                </div>
              </div>
              <input
                type="text"
                name="pubkey"
                placeholder="Destination pubkey"
                value={this.state.pubkey}
                onChange={this.updateInput}
                className="form-input" / >
              <input
                type="text"
                name="amount"
                placeholder="Amount"
                value={this.state.amount}
                onChange={this.updateInput}
                className="form-input" / >
              <button
                type="button"
                onClick={this.sendToken}
                disabled={
                  !this.state.token ||
                  !this.state.pubkey ||
                  !this.state.amount ||
                  this.getMaxSpendNormalUtxos() === 0
                }
                className="form-input">Send</button>
              {this.state.success &&
                <div className="success">
                  Token sent!
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

export default SendTokenModal;