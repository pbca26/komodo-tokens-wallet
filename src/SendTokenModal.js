import React from 'react';
import Modal from './Modal';
import TokensLib from './cclib-import';
import Blockchain from './blockchain';
import {chains} from './constants';
import {utxoSelectCC, utxoSelectNormal} from './utxo-select';
import {getMaxSpendNormalUtxos} from './math';
import writeLog from './log';
import devVars from './dev'

class SendTokenModal extends React.Component {
  state = this.initialState;
  
  get initialState() {
    this.updateInput = this.updateInput.bind(this);
    this.dropdownTrigger = this.dropdownTrigger.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.setToken = this.setToken.bind(this);

    return {
      isClosed: true,
      token: devVars && devVars.send.token || null,
      pubkey: devVars && devVars.send.pubkey || '',
      amount: devVars && devVars.send.amount || '',
      success: null,
      txid: null,
      error: null,
      tokenDropdownOpen: false,
      dropdownQuickSearch: '',
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

    writeLog('login this.state', this.state);
  }

  close() {
    this.setState({
      ...this.initialState,
      isClosed: true
    });
  }

  getTokenData(tokenid) {
    const tokenInfo = this.props.tokenList.filter(tokenInfo => tokenInfo.tokenid === tokenid)[0];
    return tokenInfo;
  }

  open() {
    const tokenInfo = this.getTokenData(this.props.tokenBalance[0].tokenId);
    const {tokenBalance} = this.props;

    this.setState({
      ...this.initialState,
      isClosed: false,
    });

    if (tokenBalance &&
        tokenBalance.length &&
        tokenBalance.length === 1 &&
        tokenInfo.height !== -1 &&
        !this.state.token) {
      this.setToken({
        balance: tokenBalance[0].balance,
        tokenId: tokenBalance[0].tokenId,
        name: tokenInfo.name,
      });
    }
  }

  setToken(token) {
    this.setState({
      token,
    });
  }

  sendToken = async () => {
    if (Number(this.state.amount) > this.state.token.balance ||
        Number(this.state.amount) < 1) {
      this.setState({
        success: null,
        txid: null,
        error: this.state.token.balance === 1 ? 'Amount must be equal to 1' : 'Amount must be between 1 and ' + this.state.token.balance,
      });
    } else {
      const {chain, address} = this.props;
      const cclibVersion = chains[chain].ccLibVersion === 1 ? 'V1' : 'V2';

      try {
        let inputsData, rawtx;
          
        writeLog('create token modal txBuilderApi', chains[chain].txBuilderApi);
        
        if (chains[chain].txBuilderApi === 'utxoSelect') {
          inputsData = {
            ccUtxos: await utxoSelectCC(
              address.cc,
              this.state.token.tokenId,
              true,
              chains[chain].ccLibVersion
            ),
            normalUtxos: await utxoSelectNormal(
              address.normal,
              10000,
              true,
              chains[chain].ccLibVersion
            ),
          };
        } else {
          inputsData = {
            ccUtxos: chains[chain].txBuilderApi === 'default' ? await TokensLib[cclibVersion].AddTokensInputsRemote(
              this.state.token.tokenId,
              address.pubkey,
              Number(this.state.amount)
            ) : await Blockchain.addCCInputs(
              this.state.token.tokenId,
              address.pubkey,
              Number(this.state.amount)
            ),
            normalUtxos: chains[chain].txBuilderApi === 'default' ? await TokensLib[cclibVersion].createTxAndAddNormalInputs(10000, address.pubkey) : await Blockchain.createCCTx(10000, address.pubkey),
          };
        }

        writeLog('send tx modal inputsData', inputsData);

        try {
          rawtx = await TokensLib[cclibVersion].transferTokenTx(
            this.state.token.tokenId,
            this.state.pubkey,
            Number(this.state.amount),
            this.props.wif,
            inputsData
          );
        } catch (e) {
          this.setState({
            success: null,
            txid: null,
            error: e.message,
          });
        }
    
        writeLog('send token rawtx', rawtx);
    
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
              success: `${chains[chain].explorerUrl}/${this.state.token.tokenId}/transactions/${txid}/${chain}`,
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
      dropdownQuickSearch: '',
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
        srcElement.className !== 'token-tile send-token-trigger' &&
        srcElement.className.indexOf('form-input-quick-search') === -1) {
      this.setState({
        tokenDropdownOpen: false,
      });
    }
  }

  render() {
    const maxNormalSpendValue = getMaxSpendNormalUtxos(this.props.normalUtxos);

    const renderDropdownOptions = () => {
      const tokenBalanceItems = this.props.tokenBalance;
      let items = [];

      if (tokenBalanceItems &&
          tokenBalanceItems.length > 2) {
        items.push(
          <input
            key="send-token-search"
            type="text"
            name="dropdownQuickSearch"
            placeholder="Search..."
            autoComplete="off"
            value={this.state.dropdownQuickSearch}
            onChange={this.updateInput}
            className="form-input form-input-quick-search" />
        );
      }

      for (let i = 0; i < tokenBalanceItems.length; i++) {
        const tokenInfo = this.getTokenData(tokenBalanceItems[i].tokenId);

        if (!this.state.dropdownQuickSearch ||
            (this.state.dropdownQuickSearch && tokenInfo.name.toLowerCase().indexOf(this.state.dropdownQuickSearch.toLowerCase()) > -1 )) {
          items.push(
            <a
              key={`send-token-${tokenBalanceItems[i].tokenId}`}
              className={`dropdown-item${tokenInfo.height === -1 ? ' disabled' : ''}`}
              title={tokenInfo.height === -1 ? 'Pending confirmation' : ''}
              onClick={tokenInfo.height === -1 ? null : () => this.setToken({
                balance: tokenBalanceItems[i].balance,
                tokenId: tokenBalanceItems[i].tokenId,
                name: tokenInfo.name
              })}>
              {tokenInfo.name}
              {tokenInfo.height > 0 &&
                <span className="dropdown-balance">{tokenBalanceItems[i].balance}</span>
              }
              {tokenInfo.height === -1 &&
                <i className="fa fa-spinner"></i>
              }
            </a>
          );
        }
      }

      return(
        <React.Fragment>{items}</React.Fragment>
      )
    };

    return (
      <React.Fragment>
        <div
          className={`token-tile send-token-trigger${maxNormalSpendValue === 0 ? ' disabled' : ''}`}
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
                  <div className="dropdown-content">{renderDropdownOptions()}</div>
                </div>
              </div>
              <input
                type="text"
                name="pubkey"
                placeholder="Destination pubkey"
                value={this.state.pubkey}
                onChange={this.updateInput}
                className="form-input" />
              <input
                type="text"
                name="amount"
                placeholder="Amount"
                value={this.state.amount}
                onChange={this.updateInput}
                className="form-input" />
              <button
                type="button"
                onClick={this.sendToken}
                disabled={
                  !this.state.token ||
                  !this.state.pubkey ||
                  !this.state.amount ||
                  maxNormalSpendValue === 0
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