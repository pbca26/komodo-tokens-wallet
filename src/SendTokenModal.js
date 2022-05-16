import React, {useState, useEffect} from 'react';
import Modal from './Modal';
import TokensLib from './cclib-import';
import Blockchain from './blockchain';
import {chains} from './constants';
import {utxoSelectCC, utxoSelectNormal} from './utxo-select';
import {getMaxSpendNormalUtxos} from './math';
import writeLog from './log';
import devVars from './dev'

const SendTokenModal = props => {
  const initialState = {
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
  const [state, setState] = useState(initialState);

  const updateInput = e => {
    if (e.target.name === 'amount') {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
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
    writeLog('send token modal state', state);
  });

  const close = () => {
    setState({
      ...initialState,
      isClosed: true
    });
  }

  const getTokenData = tokenid => {
    const tokenInfo = props.tokenList.filter(tokenInfo => tokenInfo.tokenid === tokenid)[0];
    return tokenInfo;
  }

  const open = () => {
    const {tokenBalance} = props;
    const tokenInfo = getTokenData(tokenBalance[0].tokenId);

    setState({
      ...initialState,
      isClosed: false,
    });

    if (tokenBalance &&
        tokenBalance.length &&
        tokenBalance.length === 1 &&
        tokenInfo.height !== -1 &&
        !state.token) {
      setToken({
        balance: tokenBalance[0].balance,
        tokenId: tokenBalance[0].tokenId,
        name: tokenInfo.name,
      });
    }
  }

  const setToken = token => {
    setState(prevState => ({
      ...prevState,
      token
    }));
  }

  const sendToken = async () => {
    if (Number(state.amount) > state.token.balance ||
        Number(state.amount) < 1) {
      setState(prevState => ({
        ...prevState,
        success: null,
        txid: null,
        error: state.token.balance === 1 ? 'Amount must be equal to 1' : 'Amount must be between 1 and ' + state.token.balance,
      }));
    } else {
      const {chain, address} = props;
      const cclibVersion = chains[chain].ccLibVersion === 1 ? 'V1' : 'V2';

      try {
        let inputsData, rawtx;
          
        writeLog('create token modal txBuilderApi', chains[chain].txBuilderApi);
        
        if (chains[chain].txBuilderApi === 'utxoSelect') {
          inputsData = {
            ccUtxos: await utxoSelectCC(
              address.cc,
              state.token.tokenId,
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
              state.token.tokenId,
              address.pubkey,
              Number(state.amount)
            ) : await Blockchain.addCCInputs(
              state.token.tokenId,
              address.pubkey,
              Number(state.amount)
            ),
            normalUtxos: chains[chain].txBuilderApi === 'default' ? await TokensLib[cclibVersion].createTxAndAddNormalInputs(10000, address.pubkey) : await Blockchain.createCCTx(10000, address.pubkey),
          };
        }

        writeLog('send tx modal inputsData', inputsData);

        try {
          rawtx = await TokensLib[cclibVersion].transferTokenTx(
            state.token.tokenId,
            state.pubkey,
            Number(state.amount),
            props.wif,
            inputsData
          );
        } catch (e) {
          setState(prevState => ({
            ...prevState,
            success: null,
            txid: null,
            error: e.message,
          }));
        }
    
        writeLog('send token rawtx', rawtx);
    
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
              pubkey: '',
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

  const render = () => {
    const maxNormalSpendValue = getMaxSpendNormalUtxos(props.normalUtxos);

    const renderDropdownOptions = () => {
      const tokenBalanceItems = props.tokenBalance;
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
            value={state.dropdownQuickSearch}
            onChange={updateInput}
            className="form-input form-input-quick-search" />
        );
      }

      for (let i = 0; i < tokenBalanceItems.length; i++) {
        const tokenInfo = getTokenData(tokenBalanceItems[i].tokenId);

        if (!state.dropdownQuickSearch ||
            (state.dropdownQuickSearch && tokenInfo.name.toLowerCase().indexOf(state.dropdownQuickSearch.toLowerCase()) > -1)) {
          items.push(
            <a
              key={`send-token-${tokenBalanceItems[i].tokenId}`}
              className={`dropdown-item${tokenInfo.height === -1 ? ' disabled' : ''}`}
              title={tokenInfo.height === -1 ? 'Pending confirmation' : ''}
              onClick={tokenInfo.height === -1 ? null : () => setToken({
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
          onClick={() => open()}>
          <i className="fa fa-paper-plane"></i>
          Send
        </div>
        <Modal
          show={state.isClosed === false}
          handleClose={() => close()}
          isCloseable={true}
          className="Modal-send-token">
          <div className="create-token-form">
            <h4>Send token</h4>
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
                name="pubkey"
                placeholder="Destination pubkey"
                value={state.pubkey}
                onChange={updateInput}
                className="form-input" />
              <input
                type="text"
                name="amount"
                placeholder="Amount"
                value={state.amount}
                onChange={updateInput}
                className="form-input" />
              <button
                type="button"
                onClick={sendToken}
                disabled={
                  !state.token ||
                  !state.pubkey ||
                  !state.amount ||
                  maxNormalSpendValue === 0
                }
                className="form-input">Send</button>
              {state.success &&
                <div className="success">
                  Token sent!
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

export default SendTokenModal;