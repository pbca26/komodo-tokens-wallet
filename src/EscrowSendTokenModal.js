import React from 'react';
import Modal from './Modal';
import TokensLib from './cclib-import';
import Blockchain from './blockchain';
import {chains} from './constants';
import * as utxoLib from './utxo-select';
import EscrowClass from '../escrow-scripts/escrow';

class EscrowSendTokenModal extends React.Component {
  state = this.initialState;
  
  get initialState() {
    this.updateInput = this.updateInput.bind(this);
    this.dropdownTrigger = this.dropdownTrigger.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.setToken = this.setToken.bind(this);
    this.stop = this.stop.bind(this);
    this.escrowFormTimeoutRef = null;
    this.RUN_INTERVAL = 120 * 1000;

    return {
      isClosed: true,
      token: null,
      tokensMask: null,
      success: null,
      txid: null,
      error: null,
      tokenDropdownOpen: false,
      isInProgress: false,
      stopped: false,
      log: '',
    };
  }

  updateInput(e) {
    this.setState({
      [e.target.name]: e.target.value,
      error: null,
      success: null,
      txid: null,
    });

    if (window.DEBUG) {
      setTimeout(() => {
        console.warn('escrow send token this.state', this.state);
      }, 100);
    }
  }

  close() {
    this.setState({
      ...this.initialState,
      isClosed: true
    });

    if (this.escrowFormTimeoutRef) clearTimeout(this.escrowFormTimeoutRef);
  }

  open() {
    this.setState({
      ...this.initialState,
      isClosed: false
    });

    const getTokenData = (tokenid) => {
      const tokenInfo = this.props.tokenList.filter(tokenInfo => tokenInfo.tokenid === tokenid)[0];
      return tokenInfo;
    }

    if (this.props.tokenBalance &&
        this.props.tokenBalance.length &&
        this.props.tokenBalance.length === 1 &&
        getTokenData(this.props.tokenBalance[0].tokenId).height !== -1 &&
        !this.state.token) {
      this.setToken({
        balance: this.props.tokenBalance[0].balance,
        tokenId: this.props.tokenBalance[0].tokenId,
        name: getTokenData(this.props.tokenBalance[0].tokenId).name
      });
    }
  }

  setToken(token) {
    this.setState({
      token,
    });
  }

  startEscrowCheck = async () => {
    this.setState({
      isInProgress: true,
      stopped: false,
      log: '',
    });

    const config = {
      seed: this.props.wif,
      tokenId: this.state.token.tokenId,
      tokenOutputNameMask: this.state.tokensMask,
      explorerApiUrl: chains[this.props.chain].explorerApiUrl,
    };
    const log = (...arg) => {
      console.warn('escrow step', ...arg);

      this.setState({
        log: this.state.log + [...arg].join(' ') + '\n\n',
      });

      if ([...arg].indexOf('endrun') > -1) {
        this.setState({
          log: `finished processing deposits\nresume in ${this.RUN_INTERVAL / 1000}s`,
        });

        if (this.escrowFormTimeoutRef) clearTimeout(this.escrowFormTimeoutRef);
        if (!this.state.stopped) {
          console.warn('setup escrow timer');
          this.escrowFormTimeoutRef = setTimeout(() => {
            escrow.run();
          }, this.RUN_INTERVAL);
        } else {
          console.warn('manual stop event finished');
          this.setState({
            isInProgress: false,
            stopped: false,
            log: '',
          });
        }
      }
    }
    
    const escrow = new EscrowClass(config, TokensLib.V2, Blockchain, utxoLib, log);
    
    try {
      escrow.run();
    } catch(e) {
      console.warn(e);
      /*this.setState({
        success: null,
        txid: null,
        error: e.message,
      });*/
    }
    
    /*setInterval(() => {
      escrow.run();
    }, RUN_INTERVAL);*/
  }

  stop() {
    this.setState({
      stopped: true,
      isInProgress: 'stopping',
    });
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
        srcElement.className !== 'token-tile escrow-send-token-trigger') {
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
          className={`token-tile escrow-send-token-trigger${this.getMaxSpendNormalUtxos() === 0 ? ' disabled' : ''}`}
          onClick={() => this.open()}>
          <i className="fa fa-credit-card"></i>
          Process Deposits
        </div>
        <Modal
          show={this.state.isClosed === false}
          handleClose={() => this.close()}
          isCloseable={true}
          className="Modal-send-token">
          <div className="create-token-form">
            <h4>Escrow Deposit Processing</h4>
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
                    {this.props.tokenList.map(tokenListItem => (
                      <a
                        key={`send-token-${tokenListItem.tokenid}`}
                        className="dropdown-item"
                        onClick={() => this.setToken({
                          balance: tokenListItem.supply,
                          tokenId: tokenListItem.tokenid,
                          name: getTokenData(tokenListItem.tokenid).name
                        })}>
                        {getTokenData(tokenListItem.tokenid).name}
                        {getTokenData(tokenListItem.tokenid).height > 0 &&
                          <span className="dropdown-balance">{tokenListItem.supply}</span>
                        }
                      </a>
                    ))}
                  </div>
                </div>
              </div>
              {this.state.token &&
                <a
                  href={`${chains[this.props.chain].explorerUrl}/${this.state.token.tokenId}/transactions/${this.props.chain}`}
                  target="_blank"
                  className="escrow-token-explorer-link">Open on explorer</a>
              }
              <input
                type="text"
                name="pubkey"
                placeholder="Tokens to send mask"
                value={this.state.tokensMask}
                onChange={this.updateInput}
                className="form-input" />
              <button
                type="button"
                onClick={this.state.isInProgress && !this.state.stopped ? this.stop : this.startEscrowCheck}
                disabled={
                  !this.state.token ||
                  !this.state.tokensMask ||
                  this.getMaxSpendNormalUtxos() === 0 ||
                  this.state.isInProgress === 'stopping'
                }
                className={`form-input${this.state.isInProgress && !this.state.stopped ? ' escrow-stop-btn' : ''}`}>
                {this.state.isInProgress && !this.state.stopped ? 'Stop' : (this.state.isInProgress === 'stopping' && this.state.stopped ? 'Stopping...' : 'Start')}
              </button>
              {this.state.isInProgress &&
                <React.Fragment>
                  <strong style={{'marginTop': '20px', 'display': 'block'}}>Progress log</strong>
                  <textarea
                    rows="5"
                    cols="33"
                    value={this.state.log}
                    disabled
                    style={{'marginTop': '10px', 'fontSize': '14px'}}>
                  </textarea>
                </React.Fragment>
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

export default EscrowSendTokenModal;