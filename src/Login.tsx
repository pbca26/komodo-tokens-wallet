import React, {useState, useEffect} from 'react';
import Logo from './Logo';
import TokensLib from './cclib-import';
import Blockchain from './blockchainWrapper';
import {chains} from './constants';
import writeLog from './log';
import dev from './dev';
import {LoginProps} from './types';

const Login: React.FC<LoginProps> = props => {
  const [privKeyInput, setPrivKeyInput] = useState(dev.seed || '');
  const [chainDropdownOpen, setChainDropdownOpen] = useState(false);
  const [chain, setChain] = useState('');

  const dropdownEventHandler = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();

    setChainDropdownOpen(!chainDropdownOpen);
  };

  const setChainEventHandler = (chain: string) => {
    setChain(chain);
    writeLog(`explorer is set to ${chains[chain].explorerApiUrl}`);
    Blockchain.default.setExplorerUrl(chains[chain].explorerApiUrl);
  };

  const clickOutsideHandler = () => {
    setChainDropdownOpen(false);
  };

  const getWifKeyHandler = () => {
    const ccLibVersion = chains[chain].ccLibVersion === 1 ? 'V1' : 'V2';
    const wif = TokensLib[ccLibVersion].keyToWif(privKeyInput);
    const address = TokensLib[ccLibVersion].keyToCCAddress(wif, 'wif', chains[chain].ccIndex);

    props.setKey({
      wif,
      address,
      chain,
    });

    writeLog('login wif', wif);
    writeLog('login address', address);
    writeLog(`chain ${chain}`, chains[chain]);
  };

  const enableDemo = () => {
    setPrivKeyInput('lime lime3');
    setChain(dev.chain);
    props.setIsDemo(true);
  };

  useEffect(() => {
    if (props.isDemo) {
      writeLog(`explorer is set to ${chains[chain].explorerApiUrl}`);
      Blockchain.mock.setExplorerUrl(chains[chain].explorerApiUrl);  
      getWifKeyHandler();
    }
  }, [props.isDemo]);

  useEffect(() => {
    document.addEventListener(
      'click',
      clickOutsideHandler,
      false
    );

    setChainEventHandler(dev.chain);

    return () => {
      document.removeEventListener(
        'click',
        clickOutsideHandler,
        false
      );
    };
  }, []);

  useEffect(() => {
    writeLog('login state', {
      privKeyInput,
      chainDropdownOpen,
      chain
    });
  });

  return(
    <div className="main">
      <Logo />
      <div className="content login-form">
        <h4>Login</h4>
        <p>Enter your seed phrase or WIF key in the form below</p>
        <div className="input-form">
          <div className={`dropdown${chainDropdownOpen ? ' is-active' : ''}`}>
            <div className={`dropdown-trigger${chain ? ' highlight' : ''}`}>
              <button
                className="button"
                onClick={dropdownEventHandler}>
                <span>{chain ? chain : 'Select chain'}</span>
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
                {Object.keys(chains).map(chainItem => chains[chainItem].enabled ? (
                  <a
                    key={`chain-${chainItem}`}
                    className={`dropdown-item${chain === chainItem ? ' disabled' : ''}`}
                    onClick={() => setChainEventHandler(chainItem)}>
                    <span className="dropdown-balance">{chainItem}</span>
                  </a>
                ) : (null))}
              </div>
            </div>
          </div>
          <input
            type="password"
            name="privKeyInput"
            placeholder="Seed or WIF key"
            value={privKeyInput}
            onChange={(e) => setPrivKeyInput(e.target.value)} />
          <button
            type="button"
            onClick={getWifKeyHandler}
            disabled={
              !privKeyInput ||
              !chain
            }>Login</button>
          <button
            type="button"
            className="load-demo-btn"
            onClick={enableDemo}>Load demo</button>
        </div>
      </div>
    </div>
  );
};

export default Login;