import React, {useState, useEffect} from 'react';
import Modal from './Modal';
import TokensLib from './cclib-import';
import Blockchain from './blockchain';
import {chains} from './constants';
import {toSats} from './math';
import writeLog from './log';
import {getMaxSpendNormalUtxos} from './math';
import devVars from './dev'
import {SellTokenModalProps} from './types';

const SellTokenModal: React.FC<SellTokenModalProps> = props => {
  const initialState: any = {
    isClosed: true,
    token: devVars && devVars.sell.token || '',
    pubkey: devVars && devVars.sell.pubkey || '',
    amount: devVars && devVars.sell.amount || '',
    price: devVars && devVars.sell.price || '',
    success: null,
    txid: null,
    error: null,
    tokenDropdownOpen: false,
    dropdownQuickSearch: '',
  };
  const [state, setState] = useState(initialState);

  const updateInput = (e:any) => {
    if (e.target.name === 'amount') {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    }

    if (e.target.name === 'price') {
      e.target.value = e.target.value.replace(/[^0-9.]/g, '');
    }

    setState((prevState: any) => ({
      ...prevState,
      [e.target.name]: e.target.value,
      error: null,
      success: null,
      txid: null,
    }));
  }

  useEffect(() => {
    writeLog('sell token modal state', state);
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

    const getTokenData = (tokenid: string) => {
      const tokenInfo = props.tokenList.filter((tokenInfo: any) => tokenInfo.tokenid === tokenid)[0];
      return tokenInfo;
    }

    if (props.tokenBalance &&
        props.tokenBalance.length &&
        props.tokenBalance.length === 1 &&
        getTokenData(props.tokenBalance[0].tokenId).height !== -1 &&
        !state.token) {
      setToken({
        balance: props.tokenBalance[0].balance,
        tokenId: props.tokenBalance[0].tokenId,
        name: getTokenData(props.tokenBalance[0].tokenId).name
      });
    }
  }

  const setToken = (token: any) => {
    setState((prevState: any) => ({
      ...prevState,
      token,
    }));
  }

  const sellToken = async () => {
    const {chain, address} = props;

    if (Number(state.amount) > state.token.balance ||
        Number(state.amount) < 1) {
      setState((prevState: any) => ({
        ...prevState,
        success: null,
        txid: null,
        error: state.token.balance === 1 ? 'Amount must be equal to 1' : 'Amount must be between 1 and ' + state.token.balance,
      }));
    } else {
      try {
        let inputsData, rawtx;
        writeLog('sellToken');
        writeLog(TokensLib.V2Assets);
        
        inputsData = {
          getInfo: await Blockchain.getInfo(),
          ccUtxos: await Blockchain.addCCInputs(
            state.token.tokenId,
            address.pubkey,
            Number(state.amount)
          ),
          normalUtxos: await Blockchain.createCCTx(
            toSats(state.price + 0.00001),
            address.pubkey
          ),
        };

        inputsData.getInfo = inputsData.getInfo.info;
        inputsData.getInfo.height = inputsData.getInfo.blocks;

        writeLog('selltoken inputs data', inputsData);

        try {
          rawtx = await TokensLib.V2Assets.buildTokenv2ask(
            state.token.tokenId,
            Number(state.amount),
            Number(state.price),
            props.wif,
            inputsData,
          );
        } catch (e) {
          setState((prevState: any) => ({
            ...prevState,
            success: null,
            txid: null,
            error: e.message,
          }));
        }
    
        writeLog('sell token rawtx', rawtx);
    
        if (rawtx && rawtx.substr(0, 2) === '04') {
          const {txid} = await Blockchain.broadcast(rawtx);
    
          if (!txid || txid.length !== 64) {
            setState((prevState: any) => ({
              ...prevState,
              success: null,
              txid: null,
              error: 'Unable to broadcast transaction!',
            }));
          } else {
            setState((prevState: any) => ({
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
          setState((prevState: any) => ({
            ...prevState,
            success: null,
            txid: null,
            error: 'Unable to build transaction!',
          }));
        }
      } catch (e) {
        setState((prevState: any) => ({
          ...prevState,
          success: null,
          txid: null,
          error: e.message,
        }));
      }
    }
  }

  const dropdownTrigger = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();

    setState((prevState: any) => ({
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

  const handleClickOutside = (e: any) => {
    const srcElement = e ? e.srcElement : null;

    if (e &&
        srcElement &&
        srcElement.className &&
        typeof srcElement.className === 'string' &&
        srcElement.className !== 'token-tile send-token-trigger' &&
        srcElement.className.indexOf('form-input-quick-search') === -1) {
      setState((prevState: any) => ({
        ...prevState,
        tokenDropdownOpen: false,
      }));
    }
  }

  const getTokenData = (tokenid: string) => {
    const tokenInfo = props.tokenList.filter((tokenInfo: any) => tokenInfo.tokenid === tokenid)[0];
    return tokenInfo;
  }

  const dropdownClickHandler = (tokenInfo: any, tokenBalanceItem: any) => {
    if (tokenInfo.height > -1)
      setToken({
        balance: tokenBalanceItem.balance,
        tokenId: tokenBalanceItem.tokenId,
        name: tokenInfo.name
      });
  }

  const render = () => {
    const {chain} = props;
    const maxNormalSpendValue = getMaxSpendNormalUtxos(props.normalUtxos);

    const renderDropdownOptions = () => {
      const tokenBalanceItems = props.tokenBalance;
      let items: any = [];

      if (tokenBalanceItems &&
          tokenBalanceItems.length > 2) {
        items.push(
          <input
            type="text"
            name="dropdownQuickSearch"
            placeholder="Search..."
            autoComplete="off"
            value={state.dropdownQuickSearch}
            onChange={updateInput}
            key="sell-token-quick-search"
            className="form-input form-input-quick-search" />
        );
      }

      for (let i = 0; i < tokenBalanceItems.length; i++) {
        const tokenInfo = getTokenData(tokenBalanceItems[i].tokenId);

        if (!state.dropdownQuickSearch ||
            (state.dropdownQuickSearch && tokenInfo.name.toLowerCase().indexOf(state.dropdownQuickSearch.toLowerCase()) > -1)) {
          items.push(
            <a
              key={`sell-token-${tokenBalanceItems[i].tokenId}`}
              className={`dropdown-item${tokenInfo.height === -1 ? ' disabled' : ''}`}
              title={tokenInfo.height === -1 ? 'Pending confirmation' : ''}
              onClick={() => dropdownClickHandler(tokenInfo, tokenBalanceItems[i])}>
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
          className={`token-tile send-token-trigger sell-token-trigger${maxNormalSpendValue === 0 ? ' disabled' : ''}`}
          onClick={() => open()}>
          <i className="fa fa-dollar-sign"></i>
          Ask
        </div>
        <Modal
          show={state.isClosed === false}
          handleClose={() => close()}
          isCloseable={true}
          className="Modal-send-token">
          <div className="create-token-form">
            <h4>Place token sell order</h4>
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
                onClick={sellToken}
                disabled={
                  !state.token ||
                  !state.price ||
                  !state.amount ||
                  maxNormalSpendValue === 0
                }
                className="form-input">Sell</button>
              {state.success &&
                <div className="success">
                  Token sell order placed!
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

export default SellTokenModal;