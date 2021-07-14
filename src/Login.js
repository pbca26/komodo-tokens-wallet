import React from 'react';
import TokensLib from './tokenslib.js';

class Login extends React.Component {
  state = this.initialState;

  get initialState() {
    this.updateInput = this.updateInput.bind(this);
    this.getWifKey = this.getWifKey.bind(this);

    return {
      privKeyInput: '',
    };
  }

  updateInput(e) {
    this.setState({
      [e.target.name]: e.target.value,
    });

    setTimeout(() => {
      console.warn('login this.state', this.state);
    }, 100);
  }

  getWifKey() {
    console.warn('getWifKey clicked');
    const wif = TokensLib.keyToWif(this.state.privKeyInput);
    const address = TokensLib.keyToCCAddress(wif, 'wif');
    console.warn(address);

    this.props.setKey({
      wif,
      address,
    });
  }

  render() {
    return(
      <div className="main">
        <div className="app-logo">
          <div className="box"></div>
          <div className="circle"></div>
          <img src="https://explorer.komodoplatform.com/public/img/coins/kmd.png"></img>
        </div>
        <div className="content login-form">
          <h4>Login</h4>
          <p>Enter your seed phrase or WIF key in the form below</p>
          <div className="input-form">
            <input
              type="password"
              name="privKeyInput"
              placeholder="Seed or WIF key"
              value={this.state.privKeyInput}
              onChange={this.updateInput} / >
            <button
              type="button"
              onClick={this.getWifKey}
              disabled={!this.state.privKeyInput}>Login</button>
          </div>
        </div>
      </div>
    );
  }
}

export default Login;