import React from 'react';
import Modal from './Modal';
import TokensLib from './cclib-import';
import Blockchain from './blockchain';
import {chains} from './constants';
import {utxoSelectNormal} from './utxo-select';
import {getMaxSpendNormalUtxos} from './math';
import writeLog from './log';
import devVars from './dev';

class CreateTokenModal extends React.Component {
  state = this.initialState;
  
  get initialState() {
    this.updateInput = this.updateInput.bind(this);

    return {
      isClosed: true,
      name: devVars && devVars.create.name || '',
      description: devVars && devVars.create.description || '',
      supply: devVars && devVars.send.supply || 1,
      nft: devVars && devVars.send.nft || '',
      success: null,
      error: null,
    };
  }

  updateInput(e) {
    const regexUnicodeCheckPattern = new RegExp(/^[ -~]+$/);
    const regexUnicodeCheckPatternMultiline = new RegExp(/^[ -~]+$/m);
    let error;

    if (e.target.name === 'supply') {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    }

    if (
      e.target.name === 'name' &&
      e.target.value.length &&
      !regexUnicodeCheckPattern.test(e.target.value)
    ) {
      error = 'Non-unicode characters are not allowed in token name';
    } else if (
      e.target.name === 'description' &&
      e.target.value.length &&
      !regexUnicodeCheckPatternMultiline.test(e.target.value)) {
      error = 'Non-unicode characters are not allowed in token description';
    } else if (
      e.target.name === 'nft' &&
      e.target.value.length &&
      !regexUnicodeCheckPatternMultiline.test(e.target.value)
    ) {
      error = 'Non-unicode characters are not allowed in token NFT data';
    } else if (
      e.target.name === 'name' &&
      e.target.value.length &&
      e.target.value.length > 256) {
      error = 'Name can\'t exceed 256 characters in length';
    } else if (
      e.target.name === 'description' &&
      e.target.value.length &&
      e.target.value.length > 512) {
      error = 'Token description can\'t exceed 512 characters in length';
    } else if (
      e.target.name === 'nft' &&
      e.target.value.length &&
      e.target.value.length > 1024) {
      error = 'Token NFT data can\'t exceed 1024 characters in length';
    }

    this.setState({
      [e.target.name]: e.target.value,
      error,
      success: null,
    });

    writeLog('login this.state', this.state);
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
    const maxSupply = getMaxSpendNormalUtxos(this.props.normalUtxos, 20000);
    let rawtx;

    const testJSON = (data) => {
      try {
        JSON.parse(data);
        return true;
      } catch (e) {
        return false;
      }
    };

    if (Number(this.state.supply) > maxSupply ||
        Number(this.state.supply) < 1) {
      this.setState({
        success: null,
        error: 'Token supply must be between 1 and ' + maxSupply,
      });
    } else if (
      this.state.nft &&
      this.state.nft.length &&
      this.state.nft.indexOf('{') > -1 &&
      !testJSON(this.state.nft)) {
      this.setState({
        error: 'Token NFT data is not correct JSON format (single line)',
        success: null,
      });
    } else {
      try {
        const {chain, address} = this.props;
        let inputsData;

        writeLog('create token modal txBuilderApi', chains[chain].txBuilderApi);
        
        if (chains[chain].txBuilderApi === 'utxoSelect') {
          inputsData = await utxoSelectNormal(
            address.normal,
            Number(this.state.supply) + 20000,
            true,
            chains[chain].ccLibVersion
          );
        } else {
          inputsData = chains[chain].txBuilderApi === 'default' ? await TokensLib[chains[chain].ccLibVersion === 1 ? 'V1' : 'V2'].createTxAndAddNormalInputs(Number(this.state.supply) + 10000 + 10000, address.pubkey) : await Blockchain.createCCTx(Number(this.state.supply) + 10000 + 10000, address.pubkey);
        }
        
        writeLog('create tx modal inputsData', inputsData);

        const createTxFunc = chains[chain].ccLibVersion === 1 ? TokensLib.V1.createTokenTx : this.state.nft.indexOf('{') > -1 ? TokensLib.V2.createTokenTxTokel : TokensLib.V2.createTokenTx;
        writeLog('createTxFunc', createTxFunc)
        const createTxPayload = this.state.nft.length > 0 ? {
          name: this.state.name, 
          description: this.state.description,
          supply: Number(this.state.supply),
          nft: chains[chain].ccLibVersion === 1 ? (this.state.nft.indexOf('{') > -1 ? 'f7' : '00') : this.state.nft.indexOf('{') > -1 ? JSON.parse(this.state.nft) : '00' + Buffer.from(this.state.nft).toString('hex'),
        } : {
          name: this.state.name, 
          description: this.state.description,
          supply: Number(this.state.supply),
        };
        writeLog('createTxPayload', createTxPayload);
        rawtx = await createTxFunc(
          inputsData,
          createTxPayload,
          this.props.wif
        );
      } catch (e) {
        this.setState({
          success: null,
          error: e.message,
        });
      }

      writeLog('createNewToken rawtx', rawtx);

      if (rawtx && rawtx.substr(0, 2) === '04') {
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
            supply: '',
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

  render() {
    const maxSupply = getMaxSpendNormalUtxos(this.props.normalUtxos, 20000);
    const {chain} = this.props;

    return (
      <React.Fragment>
        <div
          className={`token-tile create-new-trigger${maxSupply === 0 ? ' disabled' : ''}`}
          onClick={() => this.open()}>
          <i className="fa fa-plus"></i>
          Create
        </div>
        <Modal
          show={this.state.isClosed === false}
          handleClose={() => this.close()}
          isCloseable={true}
          className="Modal-create-token">
          <div className="create-token-form">
            <h4>New token</h4>
            <p>Provide token details in the form below</p>
            <div className="input-form">
              <input
                type="text"
                name="name"
                placeholder="Token name"
                value={this.state.name}
                onChange={this.updateInput} />
              <input
                type="text"
                name="supply"
                placeholder="Token supply"
                value={this.state.supply}
                onChange={this.updateInput} />
              <textarea
                rows="5"
                cols="33"
                name="description"
                placeholder="Token description"
                value={this.state.description}
                onChange={this.updateInput}>
              </textarea>
              <textarea
                rows="5"
                cols="33"
                name="nft"
                placeholder="Token NFT data (optional)"
                value={this.state.nft}
                onChange={this.updateInput}>
              </textarea>
              <button
                type="button"
                onClick={this.createNewToken}
                disabled={
                  !this.state.name ||
                  !this.state.supply ||
                  maxSupply === 0
                }>Create</button>
              {this.state.success &&
                <div className="success">
                  Token created!
                  <div className="txid-label">
                    <strong>Transaction ID:</strong> {this.state.success}
                  </div>
                  <a
                    href={`${chains[chain].explorerUrl}/${this.state.success}/transactions/${chain}`}
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