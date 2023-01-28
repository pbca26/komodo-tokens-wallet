import React, {useState, useEffect} from 'react';
import Modal from './Modal';
import TokensLib from './cclib-import';
import Blockchain from './blockchain';
import {chains} from './constants';
import {utxoSelectCC, utxoSelectNormal} from './utxo-select';
import {toSats} from './math';
import writeLog from './log';
import {getMaxSpendNormalUtxos} from './math';
import devVars from './dev'

const BuyTokenModal  = props => {
  const initialState = {
    isClosed: true,
    token: devVars && devVars.buy.token || '',
    pubkey: devVars && devVars.buy.pubkey || '',
    amount: devVars && devVars.buy.amount || '',
    price: devVars && devVars.buy.price || '',
    success: null,
    txid: null,
    error: null,
    tokenDropdownOpen: false,
    dropdownQuickSearch: '',
  };
  const [state, setState] = useState(initialState);

  const updateInput = e => {
    if (e.target.name === 'amount') {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    }

    if (e.target.name === 'price') {
      e.target.value = e.target.value.replace(/[^0-9.]/g, '');
    }

    setState(prevState => ({
      ...prevState,
      [e.target.name]: e.target.value,
      error: null,
      success: null,
      txid: null,
    }));
  }

  useEffect(() => {
    writeLog('buy token modal state', state);
  });

  const close = () => {
    setState({
      ...initialState,
      isClosed: true
    });
  }

  const open = () => {
    setState({
      ...initialState,
      isClosed: false
    });

    if (props.tokenList &&
        props.tokenList.length &&
        props.tokenList.length === 1 &&
        getTokenData(props.tokenList[0].tokenid).height !== -1 &&
        !state.token) {
      setToken({
        balance: props.tokenList[0].supply,
        tokenId: props.tokenList[0].tokenid,
        name: getTokenData(props.tokenList[0].tokenid).name
      });
    }
  }

  const setToken = token => {
    setState(prevState => ({
      ...prevState,
      token,
    }));
  }

  const buyToken = async () => {
    const {address, chain} = props;

    if (Number(state.amount) > state.token.balance ||
        Number(state.amount) < 1) {
      setState(prevState => ({
        ...prevState,
        success: null,
        txid: null,
        error: state.token.balance === 1 ? 'Amount must be equal to 1' : 'Amount must be between 1 and ' + state.token.balance,
      }));
    } else if (toSats(state.price * state.amount) > getMaxSpendNormalUtxos(props.normalUtxos)) {
      
      setState(prevState => ({
        ...prevState,
        success: null,
        txid: null,
        error: 'Not enough balance',
      }));
    } else {
      try {
        let inputsData, rawtx;
        writeLog('buyToken');
        writeLog(TokensLib.V2Assets)
        
        inputsData = {
          getInfo: await Blockchain.getInfo(),
          normalUtxos: await Blockchain.createCCTx(
            toSats(state.price * state.amount) + 10000,
            address.pubkey
          ),
        };

        inputsData.getInfo = inputsData.getInfo.info;
        inputsData.getInfo.height = inputsData.getInfo.blocks;

        writeLog('buytoken inputs data', inputsData);

        try {
          rawtx = await TokensLib.V2Assets.buildTokenv2bid(
            state.token.tokenId,
            Number(state.amount),
            Number(state.price),
            props.wif,
            inputsData,
          );
        } catch (e) {
          setState(prevState => ({
            ...prevState,
            success: null,
            txid: null,
            error: e.message,
          }));
        }
    
        writeLog('buy token rawtx', rawtx);
    
        if (rawtx && rawtx.substr(0, 2) === '04') {
          const {txid} = await Blockchain.broadcast(rawtx);
    
          if (!txid || txid.length !== 64) {
            setState(prevState => ({
              ...prevState,
              success: null,
              txid: null,
              error: 'Unable to broadcast transaction!',
            }));
          } else {
            setState(prevState => ({
              ...prevState,
              success: `${chains[chain].explorerUrl}/${state.token.tokenId}/transactions/${txid}/${chain}`,
              txid,
              error: null,
              price: '',
              token: null,
              amount: '',
              tokenDropdownOpen: false,
            }));
            setTimeout(() => {
              props.syncData();
            }, 100);
          }
        } else {
          setState(prevState => ({
            ...prevState,
            success: null,
            txid: null,
            error: 'Unable to build transaction!',
          }));
        }
      } catch (e) {
        setState(prevState => ({
          ...prevState,
          success: null,
          txid: null,
          error: e.message,
        }));
      }
    }
  }

  const dropdownTrigger = e => {
    e.stopPropagation();

    setState(prevState => ({
      ...prevState,
      tokenDropdownOpen: !state.tokenDropdownOpen,
      dropdownQuickSearch: '',
    }));
  }

  useEffect(() => {
    document.addEventListener(
      'click',
      handleClickOutside,
      false
    );

    return () => {
      document.removeEventListener(
        'click',
        handleClickOutside,
        false
      );
    };
  }, []);

  const handleClickOutside = e => {
    const srcElement = e ? e.srcElement : null;
    let state = {};

    if (e &&
        srcElement &&
        srcElement.className &&
        typeof srcElement.className === 'string' &&
        srcElement.className !== 'token-tile send-token-trigger' &&
        srcElement.className.indexOf('form-input-quick-search') === -1) {
      setState(prevState => ({
        ...prevState,
        tokenDropdownOpen: false,
      }));
    }
  }

  const getTokenData = tokenid => {
    const tokenInfo = props.tokenList.filter(tokenInfo => tokenInfo.tokenid === tokenid)[0];
    return tokenInfo || {};
  }

  const render = () => {
    const maxNormalSpendValue = getMaxSpendNormalUtxos(props.normalUtxos);
    const {chain} = props;

    const renderDropdownOptions = () => {
      const tokenListItems = props.tokenList;
      let items = [];

      if (tokenListItems &&
          tokenListItems.length > 2) {
        items.push(
          <input
            type="text"
            name="dropdownQuickSearch"
            placeholder="Search..."
            autoComplete="off"
            value={state.dropdownQuickSearch}
            onChange={updateInput}
            key="buy-token-quick-search"
            className="form-input form-input-quick-search" />
        );
      }

      for (let i = 0; i < tokenListItems.length; i++)  {
        const tokenInfo = getTokenData(tokenListItems[i].tokenid);

        if (!state.dropdownQuickSearch ||
            (state.dropdownQuickSearch && tokenInfo.name.toLowerCase().indexOf(state.dropdownQuickSearch.toLowerCase()) > -1)) {
          items.push(
            <a
              key={`buy-token-${tokenListItems[i].tokenid}`}
              className={`dropdown-item${tokenInfo.height === -1 ? ' disabled' : ''}`}
              title={tokenInfo.height === -1 ? `Pending confirmation` : ''}
              onClick={tokenInfo.height === -1 ? null : () => setToken({
                balance: tokenListItems[i].supply,
                tokenId: tokenListItems[i].tokenid,
                name: tokenInfo.name
              })}>
              {tokenInfo.name}
              {tokenInfo.height > 0 &&
                <span className="dropdown-balance">{tokenListItems[i].supply}</span>
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
          className={`token-tile send-token-trigger buy-token-trigger${maxNormalSpendValue === 0 ? ' disabled' : ''}`}
          onClick={() => open()}>
          <i className="fa fa-dollar-sign"></i>
          Bid
        </div>
        <Modal
          show={state.isClosed === false}
          handleClose={() => close()}
          isCloseable={true}
          className="Modal-send-token">
          <div className="create-token-form">
            <h4>Place token buy order</h4>
            <p>Fill out the form below</p>
            <div className="input-form">
              <div className={`dropdown${state.tokenDropdownOpen ? ' is-active' : ''}`}>
                <div className={`dropdown-trigger${state.token ? ' highlight' : ''}`}>
                  <button
                    className="button"
                    onClick={dropdownTrigger}>
                    <span>{state.token && state.token.name ? state.token.name : 'Select token'}</span>
                    {state.token &&
                      <span className="dropdown-balance">{state.token.balance}</span>
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
                name="amount"
                placeholder="Amount (qty)"
                value={state.amount}
                onChange={updateInput}
                className="form-input" />
              <input
                type="text"
                name="price"
                placeholder={`Price in ${chain}`}
                value={state.price}
                onChange={updateInput}
                className="form-input" />
              <button
                type="button"
                onClick={buyToken}
                disabled={
                  !state.token ||
                  !state.price ||
                  !state.amount ||
                  maxNormalSpendValue === 0
                }
                className="form-input">Buy</button>
              {state.success &&
                <div className="success">
                  Token buy order placed!
                  <div className="txid-label">
                    <strong>Transaction ID:</strong> {state.txid}
                  </div>
                  <a
                    href={state.success}
                    target="_blank">Open on explorer</a>
                </div>
              }
              {state.error &&
                <div className="error">
                  <div>
                    <strong>Error!</strong>
                    <div>{state.error}</div>
                  </div>
                </div>
              }
            </div>
          </div>
        </Modal>
      </React.Fragment>
    );
  }

  return render();
}

export default BuyTokenModal;