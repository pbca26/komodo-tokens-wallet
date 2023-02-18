import React, {useState, useEffect} from 'react';
import Modal from './Modal';
import TokensLib from './cclib-import';
import Blockchain from './blockchain';
import {chains} from './constants';
import * as utxoLib from './utxo-select';
import EscrowClass from '../escrow-scripts/escrow';
import writeLog from './log';
import {SendTokenModalProps} from './types';

let escrowFormTimeoutRef: ReturnType<typeof setTimeout>;
let RUN_INTERVAL = 120 * 1000;

const EscrowSendTokenModal: React.FC<SendTokenModalProps> = props => {
  const initialState: any = {
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
  const [state, setState] = useState(initialState);

  const updateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((prevState: any) => ({
      ...prevState,
      [e.target.name]: e.target.value,
      error: null,
      success: null,
      txid: null,
    }));
  }

  useEffect(() => {
    writeLog('escrow send token modal state', state);
  });

  const close = () => {
    setState({
      ...initialState,
      isClosed: true
    });

    if (escrowFormTimeoutRef) clearTimeout(escrowFormTimeoutRef);
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

  const startEscrowCheck = async () => {
    setState((prevState: any) => ({
      ...prevState,
      isInProgress: true,
      stopped: false,
      log: '',
    }));

    const config = {
      seed: props.wif,
      tokenId: state.token.tokenId,
      tokenOutputNameMask: state.tokensMask,
      explorerApiUrl: chains[props.chain].explorerApiUrl,
    };
    const log = (...arg: any) => {
      writeLog('escrow step', ...arg);

      setState((prevState: any) => ({
        ...prevState,
        log: state.log + [...arg].join(' ') + '\n\n',
      }));

      if ([...arg].indexOf('endrun') > -1) {
        setState((prevState: any) => ({
          ...prevState,
          log: `finished processing deposits\nresume in ${RUN_INTERVAL / 1000}s`,
        }));

        if (escrowFormTimeoutRef) clearTimeout(escrowFormTimeoutRef);
        if (!state.stopped) {
          writeLog('setup escrow timer');
          escrowFormTimeoutRef = setTimeout(() => {
            escrow.run();
          }, RUN_INTERVAL);
        } else {
          writeLog('manual stop event finished');
          setState((prevState: any) => ({
            ...prevState,
            isInProgress: false,
            stopped: false,
            log: '',
          }));
        }
      }
    }
    
    const escrow = new EscrowClass(config, TokensLib.V2, Blockchain, utxoLib, log);
    
    try {
      escrow.run();
    } catch(e) {
      writeLog(e);
      /*setState(prevState => ({
      ...prevState,
        success: null,
        txid: null,
        error: e.message,
      }));*/
    }
    
    /*setInterval(() => {
      escrow.run();
    }, RUN_INTERVAL);*/
  }

  const stop = () => {
    setState((prevState: any) => ({
      ...prevState,
      stopped: true,
      isInProgress: 'stopping',
    }));
  }

  const dropdownTrigger = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();

    setState((prevState: any) => ({
      ...prevState,
      tokenDropdownOpen: !state.tokenDropdownOpen,
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
        srcElement.className !== 'token-tile escrow-send-token-trigger') {
      setState((prevState: any) => ({
        ...prevState,
        tokenDropdownOpen: false,
      }));
    }
  }

  const getMaxSpendNormalUtxos = () => {
    const normalUtxos = props.normalUtxos;
    let maxSpend = -10000;

    for (let i = 0; i < normalUtxos.length; i++) {
      maxSpend += normalUtxos[i].satoshis;
    }

    return maxSpend < 0 ? 0 : maxSpend;
  };

  const render = () => {
    const getTokenData = (tokenid: string) => {
      const tokenInfo = props.tokenList.filter((tokenInfo: any) => tokenInfo.tokenid === tokenid)[0];
      return tokenInfo;
    }

    return (
      <React.Fragment>
        <div
          className={`token-tile escrow-send-token-trigger${getMaxSpendNormalUtxos() === 0 ? ' disabled' : ''}`}
          onClick={() => open()}>
          <i className="fa fa-credit-card"></i>
          Process Deposits
        </div>
        <Modal
          show={state.isClosed === false}
          handleClose={() => close()}
          isCloseable={true}
          className="Modal-send-token">
          <div className="create-token-form">
            <h4>Escrow Deposit Processing</h4>
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
                  <div className="dropdown-content">
                    {props.tokenList.map((tokenListItem: any) => (
                      <a
                        key={`send-token-${tokenListItem.tokenid}`}
                        className="dropdown-item"
                        onClick={() => setToken({
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
              {state.token &&
                <a
                  href={`${chains[props.chain].explorerUrl}/${state.token.tokenId}/transactions/${props.chain}`}
                  target="_blank"
                  className="escrow-token-explorer-link">Open on explorer</a>
              }
              <input
                type="text"
                name="pubkey"
                placeholder="Tokens to send mask"
                value={state.tokensMask}
                onChange={updateInput}
                className="form-input" />
              <button
                type="button"
                onClick={state.isInProgress && !state.stopped ? stop : startEscrowCheck}
                disabled={
                  !state.token ||
                  !state.tokensMask ||
                  getMaxSpendNormalUtxos() === 0 ||
                  state.isInProgress === 'stopping'
                }
                className={`form-input${state.isInProgress && !state.stopped ? ' escrow-stop-btn' : ''}`}>
                {state.isInProgress && !state.stopped ? 'Stop' : (state.isInProgress === 'stopping' && state.stopped ? 'Stopping...' : 'Start')}
              </button>
              {state.isInProgress &&
                <React.Fragment>
                  <strong style={{'marginTop': '20px', 'display': 'block'}}>Progress log</strong>
                  <textarea
                    rows={5}
                    cols={33}
                    value={state.log}
                    disabled
                    style={{'marginTop': '10px', 'fontSize': '14px'}}>
                  </textarea>
                </React.Fragment>
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

export default EscrowSendTokenModal;