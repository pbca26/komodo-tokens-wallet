import React from 'react';
import Logo from './Logo';
import TokensLib from './cclib-import';
import Blockchain from './blockchain';
import {chains} from './constants';
import writeLog from './log';

class Login extends React.Component {
  state = this.initialState;

  get initialState() {
    this.updateInput = this.updateInput.bind(this);
    this.getWifKey = this.getWifKey.bind(this);
    this.dropdownTrigger = this.dropdownTrigger.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.setChain = this.setChain.bind(this);

    return {
      privKeyInput: '',
      chainDropdownOpen: false,
      chain: null,
    };
  }

  setChain(chain) {
    this.setState({
      chain,
    });

    writeLog('explorer is set to ' + chains[chain].explorerApiUrl);
    if (!process || (process && process.title.indexOf('node') === -1)) Blockchain.setFetch(fetch, Headers);
    Blockchain.setExplorerUrl(chains[chain].explorerApiUrl);
  }

  dropdownTrigger(e) {
    e.stopPropagation();

    this.setState({
      chainDropdownOpen: !this.state.chainDropdownOpen,
    });
  }

  componentWillMount() {
    document.addEventListener(
      'click',
      this.handleClickOutside,
      false
    );

    this.setChain('TKLTEST');
  }

  componentWillUnmount() {
    document.removeEventListener(
      'click',
      this.handleClickOutside,
      false
    );
  }

  handleClickOutside(e) {
    this.setState({
      chainDropdownOpen: false,
    });
  }

  updateInput(e) {
    this.setState({
      [e.target.name]: e.target.value,
    });

    setTimeout(() => {
      writeLog('login this.state', this.state);
    }, 100);
  }

  getWifKey() {
    const {chain} = this.state;
    const ccLibVersion = chains[chain].ccLibVersion === 1 ? 'V1' : 'V2';
    const wif = TokensLib[ccLibVersion].keyToWif(this.state.privKeyInput);
    const address = TokensLib[ccLibVersion].keyToCCAddress(wif, 'wif', chains[chain].ccIndex);

    this.props.setKey({
      wif,
      address,
      chain,
    });

    writeLog('login wif', wif);
    writeLog('login address', address);
    writeLog('chain ' + chain, chains[chain]);
  }

  render() {
    return(
      <div className="main">
        <Logo />
        <div className="content login-form">
          <h4>Login</h4>
          <p>Enter your seed phrase or WIF key in the form below</p>
          <div className="input-form">
            <div className={`dropdown${this.state.chainDropdownOpen ? ' is-active' : ''}`}>
              <div className={`dropdown-trigger${this.state.chain ? ' highlight' : ''}`}>
                <button
                  className="button"
                  onClick={this.dropdownTrigger}>
                  <span>{this.state.chain ? this.state.chain : 'Select chain'}</span>
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
                  {Object.keys(chains).map(chain => chains[chain].enabled ? (
                    <a
                      key={`chain-${chain}`}
                      className="dropdown-item"
                      onClick={() => this.setChain(chain)}>
                      <span className="dropdown-balance">{chain}</span>
                    </a>
                  ) : (null))}
                </div>
              </div>
            </div>
            <input
              type="password"
              name="privKeyInput"
              placeholder="Seed or WIF key"
              value={this.state.privKeyInput}
              onChange={this.updateInput} />
            <button
              type="button"
              onClick={this.getWifKey}
              disabled={
                !this.state.privKeyInput ||
                !this.state.chain
              }>Login</button>
          </div>
        </div>
      </div>
    );
  }
}

export default Login;