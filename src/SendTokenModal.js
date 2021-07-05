import React from 'react';
import Modal from './Modal';
import TokensLib from './tokenslib.js';
import Blockchain from './blockchain';
import {coin, explorerApiUrl, explorerUrl} from './constants';

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
      amount: 0,
      success: null,
      error: null,
      tokenDropdownOpen: false,
    };
  }

  updateInput(e) {
    if (e.target.name === 'amount') {
      e.target.value = e.target.value.replace(/[^0-9.]/g, '');
    }

    this.setState({
      [e.target.name]: e.target.value,
    });

    setTimeout(() => {
      console.warn('login this.state', this.state);
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

  setToken(token) {
    this.setState({
      token,
    });
  }

  sendToken = async () => {
    let inputsData, rawtx;

    if (Number(this.state.amount) > this.state.token.balance || Number(this.state.amount) < 1) {
      this.setState({
        success: null,
        error: 'Amount must be between 1 and ' + this.state.token.balance,
      });
    } else {
      try {
        inputsData = await TokensLib.AddTokensInputsRemote(
          this.state.token.tokenId, this.props.address.pubkey, Number(this.state.amount)
        );

        try {
          rawtx = await TokensLib.transferTokenTx(
            this.state.token.tokenId, this.state.pubkey, Number(this.state.amount), this.props.wif, inputsData
          );
        } catch (e) {
          this.setState({
            success: null,
            error: e.message,
          });
        }
    
        console.warn('send token rawtx', rawtx);
    
        if (rawtx.substr(0, 2) === '04') {
          const {txid} = await Blockchain.broadcast(rawtx);
    
          if (!txid || txid.length !== 64) {
            this.setState({
              success: null,
              error: 'Unable to broadcast transaction!',
            });
          } else {
            this.setState({
              success: txid,
              error: null,
              pubkey: '',
              amount: 0,
              tokenDropdownOpen: false,
            });
            setTimeout(() => {
              this.props.syncData();
            }, 100);
          }
        } else {
          this.setState({
            success: null,
            error: 'Unable to build transaction!',
          });
        }
      } catch (e) {
        this.setState({
          success: null,
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
        srcElement.className !== 'send-token-btn') {
      this.setState({
        tokenDropdownOpen: false,
      });
    }
  }

  render() {
    const getTokenData = (tokenid) => {
      const tokenInfo = this.props.tokenList.filter(tokenInfo => tokenInfo.tokenid === tokenid)[0];
      return tokenInfo;
      console.warn(tokenInfo);
    }

    return (
      <React.Fragment>
        <div
          className="send-token-btn"
          onClick={() => this.open()}>
          <i
            style={{'paddingRight': '5px'}} 
            className="fa fa-paper-plane"></i>
          Send
        </div>
        <Modal
          show={this.state.isClosed === false}
          handleClose={() => this.close()}
          isCloseable={true}
          className="Modal-send-token">
          <div>
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
                        onClick={() => this.setToken({
                          balance: tokenBalanceItem.balance,
                          tokenId: tokenBalanceItem.tokenId,
                          name: getTokenData(tokenBalanceItem.tokenId).name
                        })}>
                        {getTokenData(tokenBalanceItem.tokenId).name} <span className="dropdown-balance">{tokenBalanceItem.balance}</span>
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
                className="form-input pubkey-field" / >
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
                disabled={!this.state.token || !this.state.pubkey || !this.state.amount}
                className="form-input">Send</button>
              {this.state.success &&
                <div className="success">
                  Token sent!
                  <div className="txid-label">
                    <strong>Transaction ID:</strong> {this.state.success}
                  </div>
                  <a
                    href={`${explorerUrl}/${this.state.token.tokenId}/transactions/${this.state.success}/${coin}`}
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