import React from 'react';
import Modal from './Modal';
import TokensLib from './tokenslib.js';
import Blockchain from './blockchain';
import {coin, explorerApiUrl, explorerUrl} from './constants';

class CreateTokenModal extends React.Component {
  state = this.initialState;
  
  get initialState() {
    this.updateInput = this.updateInput.bind(this);
    this.getMaxSupply = this.getMaxSupply.bind(this);

    return {
      isClosed: true,
      name: '',
      description: '',
      supply: 1,
      success: null,
      error: null,
    };
  }

  updateInput(e) {
    if (e.target.name === 'supply') {
      e.target.value = e.target.value.replace(/[^0-9.]/g, '');
    }

    this.setState({
      [e.target.name]: e.target.value,
    });

    setTimeout(() => {
      console.warn('login this.state', this.state);
    }, 100);
  }

  close() {
    this.setState({
      ...this.initialState,
      isClosed: true,
    });
  }

  open() {
    if (this.props.normalUtxos.length)
      this.setState({
        ...this.initialState,
        isClosed: false,
      });
  }

  createNewToken = async () => {
    let rawtx;

    if (Number(this.state.supply) > this.getMaxSupply() || Number(this.state.supply) < 1) {
      this.setState({
        success: null,
        error: 'Supply must be between 1 and ' + this.getMaxSupply(),
      });
    } else {
      try {
        rawtx = await TokensLib.createTokenTx({
          name: this.state.name, 
          description: this.state.description,
          supply: Number(this.state.supply),
        }, this.props.wif);
      } catch (e) {
        this.setState({
          success: null,
          error: e.message,
        });
      }

      console.warn('createNewToken rawtx', rawtx);

      if (rawtx.substr(0, 2) === '04') {
        const {txid} = await Blockchain.broadcast(rawtx);

        if (!txid || txid.length !== 64) {
          this.setState({
            success: null,
            error: 'Unable to broadcast transaction!',
          });
        } else {
          this.setState({
            success: txid,
            error: null,
            name: '',
            description: '',
            supply: 0,
          });

          setTimeout(() => {
            this.props.syncData();
          }, 100);
        }
      } else {
        this.setState({
          success: null,
          error: 'Unable to create transaction!',
        });
      }
    }
  }

  getMaxSupply() {
    const normalUtxos = this.props.normalUtxos;
    let maxSupply = -20000; // maker + tx fee

    for (let i = 0; i < normalUtxos.length; i++) {
      maxSupply += normalUtxos[i].satoshis;
    }

    return maxSupply < 0 ? 0 : maxSupply;
  };

  render() {
    return (
      <React.Fragment>
        <div
          className="create-token-btn"
          onClick={() => this.open()}>
          <i
            style={{'paddingRight': '5px'}}
            className="fa fa-plus"></i>
          Create
        </div>
        <Modal
          show={this.state.isClosed === false}
          handleClose={() => this.close()}
          isCloseable={true}
          className="Modal-create-token">
          <div>
            <h4>New token</h4>
            <p>Provide token details in the form below</p>
            <div className="input-form">
              <input
                type="text"
                name="name"
                placeholder="Token name"
                value={this.state.name}
                onChange={this.updateInput} / >
              <textarea
                rows="5"
                cols="33"
                name="description"
                placeholder="Token description"
                value={this.state.description}
                onChange={this.updateInput}>
              </textarea>
              <input
                type="text"
                name="supply"
                placeholder="Token supply"
                value={this.state.supply}
                onChange={this.updateInput} / >
              <button
                type="button"
                onClick={this.createNewToken}
                disabled={!this.state.name || !this.state.supply}>Create</button>
              {this.state.success &&
                <div className="success">
                  Token created!
                  <div className="txid-label">
                    <strong>Transaction ID:</strong> {this.state.success}
                  </div>
                  <a
                    href={`${explorerUrl}/${this.state.success}/transactions/${coin}`}
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

export default CreateTokenModal;