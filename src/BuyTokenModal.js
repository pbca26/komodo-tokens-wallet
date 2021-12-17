import React from 'react';
import Modal from './Modal';
import TokensLib from './cclib-import';
import Blockchain from './blockchain';
import {chains} from './constants';
import {utxoSelectCC, utxoSelectNormal} from './utxo-select';
import {toSats} from './math';

class BuyTokenModal extends React.Component {
  state = this.initialState;
  
  get initialState() {
    this.updateInput = this.updateInput.bind(this);
    this.dropdownTrigger = this.dropdownTrigger.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.setToken = this.setToken.bind(this);

    return {
      isClosed: true,
      token: null,
      pubkey: '03256ba44eeb188404b94ae8ed64f1fe6ad89580375830845361e365598efa3ff3',
      amount: 1,
      price: 0.00001,
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

    if (e.target.name === 'price') {
      e.target.value = e.target.value.replace(/[^0-9.]/g, '');
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

    const getTokenData = (tokenid) => {
      const tokenInfo = this.props.tokenList.filter(tokenInfo => tokenInfo.tokenid === tokenid)[0];
      return tokenInfo;
    }

    if (this.props.tokenList &&
        this.props.tokenList.length &&
        this.props.tokenList.length === 1 &&
        getTokenData(this.props.tokenList[0].tokenid).height !== -1 &&
        !this.state.token) {
      this.setToken({
        balance: this.props.tokenList[0].supply,
        tokenId: this.props.tokenList[0].tokenid,
        name: getTokenData(this.props.tokenList[0].tokenid).name
      });
    }
  }

  setToken(token) {
    this.setState({
      token,
    });
  }

  buyToken = async () => {
    if (Number(this.state.amount) > this.state.token.balance || Number(this.state.amount) < 1) {
      this.setState({
        success: null,
        txid: null,
        error: this.state.token.balance === 1 ? 'Amount must be equal to 1' : 'Amount must be between 1 and ' + this.state.token.balance,
      });
    } else {
      try {
        let inputsData, rawtx;
        console.warn('buyToken');
        console.warn(TokensLib.V2Assets)
        
        inputsData = {
          getInfo: await Blockchain.getInfo(),
          ccUtxos: await Blockchain.addCCInputs(this.state.token.tokenId, this.props.address.pubkey, Number(this.state.amount)),
          normalUtxos: await Blockchain.createCCTx(toSats(this.state.price * this.state.amount) + 10000, this.props.address.pubkey),
        };

        inputsData.getInfo = inputsData.getInfo.info;
        inputsData.getInfo.height = inputsData.getInfo.blocks;

        console.warn('buytoken inputs data', inputsData);

        try {
          rawtx = await TokensLib.V2Assets.buildTokenv2bid(
            this.state.token.tokenId,
            Number(this.state.amount),
            Number(this.state.price),
            this.props.wif,
            inputsData,
          );
        } catch (e) {
          this.setState({
            success: null,
            txid: null,
            error: e.message,
          });
        }
    
        if (window.DEBUG) {
          console.warn('buy token rawtx', rawtx);
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
              success: `${chains[this.props.chain].explorerUrl}/${this.state.token.tokenId}/transactions/${txid}/${this.props.chain}`,
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
      return tokenInfo || {};
    }

    return (
      <React.Fragment>
        <div
          className={`token-tile send-token-trigger buy-token-trigger${this.getMaxSpendNormalUtxos() === 0 ? ' disabled' : ''}`}
          onClick={() => this.open()}>
          <i className="fa fa-dollar-sign"></i>
          Bid
        </div>
        <Modal
          show={this.state.isClosed === false}
          handleClose={() => this.close()}
          isCloseable={true}
          className="Modal-send-token">
          <div className="create-token-form">
            <h4>Place token buy order</h4>
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
                        className={`dropdown-item${getTokenData(tokenListItem.tokenid).height === -1 ? ' disabled' : ''}`}
                        title={getTokenData(tokenListItem.tokenId).height === -1 ? `Pending confirmation` : ''}
                        onClick={getTokenData(tokenListItem.tokenId).height === -1 ? null : () => this.setToken({
                          balance: tokenListItem.supply,
                          tokenId: tokenListItem.tokenid,
                          name: getTokenData(tokenListItem.tokenid).name
                        })}>
                        {getTokenData(tokenListItem.tokenid).name}
                        {getTokenData(tokenListItem.tokenid).height > 0 &&
                          <span className="dropdown-balance">{tokenListItem.supply}</span>
                        }
                        {getTokenData(tokenListItem.tokenidtokenid).height === -1 &&
                          <i className="fa fa-spinner"></i>
                        }
                      </a>
                    ))}
                  </div>
                </div>
              </div>
              <input
                type="text"
                name="amount"
                placeholder="Amount (qty)"
                value={this.state.amount}
                onChange={this.updateInput}
                className="form-input" / >
              <input
                type="text"
                name="price"
                placeholder={`Price in ${this.props.chain}`}
                value={this.state.price}
                onChange={this.updateInput}
                className="form-input" / >
              <button
                type="button"
                onClick={this.buyToken}
                disabled={
                  !this.state.token ||
                  !this.state.price ||
                  !this.state.amount ||
                  this.getMaxSpendNormalUtxos() === 0
                }
                className="form-input">Buy</button>
              {this.state.success &&
                <div className="success">
                  Token buy order placed!
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

export default BuyTokenModal;