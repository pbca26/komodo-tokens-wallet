import React from 'react';
import Modal from './Modal';
import TokensLib from './cclib-import';
import Blockchain from './blockchain';
import {chains} from './constants';
import {utxoSelectNormal} from './utxo-select';

const jsonFormatExample = [{
  "name": "token1",
  "supply": 1,
  "description": "Some description",
  "nft": "{\"url\": \"someurl\", \"id\": 1, \"royalty\": 10, \"arbitrary\": {\"some key\":\"some prop\"}}"
}];

let checkTxConfsTimer;

class BatchCreateTokenModal extends React.Component {
  state = this.initialState;
  
  get initialState() {
    this.updateInput = this.updateInput.bind(this);
    this.getMaxSupply = this.getMaxSupply.bind(this);

    return {
      isClosed: true,
      batchJson: null,
      currentTokenNumber: 0,
      currentTokenName: null,
      totalTokens: 0,
      success: null,
      error: null,
      inProgress: -1,
    };
  }

  checkTxConfs = async txid => {
    const self = this;

    try {
      const txData = await Blockchain.getTransaction(txid);
      console.warn('txData', txData);

      if (txData && txData.confirmations && Number(txData.confirmations) >= 1) {
        console.warn(txid, 'is confirmed');
        this.props.syncData();
        if (checkTxConfsTimer) clearTimeout(checkTxConfsTimer);
        const txData1 = await Blockchain.getTransaction(txid);
        this.createNewTokenBatch(true);
      } else {
        checkTxConfsTimer = setTimeout(() => {
          self.checkTxConfs(txid);
        }, 5000);
      }
    } catch (e) {
      console.warn('error fetching confs data, retry', e);
      checkTxConfsTimer = setTimeout(() => {
        self.checkTxConfs(txid);
      }, 5000);
    }
  };

  updateInput(e) {
    this.setState({
      [e.target.name]: e.target.value,
      error: null,
      success: null,
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

  createNewTokenBatch = async (isAuto) => {
    const tokens = JSON.parse(this.state.batchJson);
    const i = this.state.currentTokenNumber;
    let rawtx;
    //console.log(tokens);
    //console.log(typeof tokens);

    if (!isAuto) {
      this.setState({
        success: null,
        error: null,
        currentTokenName: null,
        currentTokenNumber: 0,
        totalTokens: 0,
      });
    }

    const formatNftData = (data) => {
      let _data = JSON.parse(data);

      if (_data.arbitrary) {
        if (typeof _data.arbitrary === 'object' || Array.isArray(_data.arbitrary)) {
          _data.arbitrary = Buffer.from(JSON.stringify(_data.arbitrary)).toString('hex');
        } else if (/^[A-F0-9]+$/i.test(_data.arbitrary)) {
          // hex string, do nothing
          //console.warn('arbitrary is a hex str');
        } else {
          _data.arbitrary = Buffer.from(_data.arbitrary.toString()).toString('hex');
        }
      }
      
      return _data;
    };

    if (i < tokens.length) {
      console.warn('token name', tokens[i].name);
      console.warn('token nft', tokens[i].nft);

      try {
        let inputsData;

        console.warn('create token modal txBuilderApi', chains[this.props.chain].txBuilderApi);
        
        if (chains[this.props.chain].txBuilderApi === 'utxoSelect') {
          inputsData = await utxoSelectNormal(this.props.address.normal, Number(tokens[i].supply) + 20000, true, chains[this.props.chain].ccLibVersion);
        } else {
          inputsData = chains[this.props.chain].txBuilderApi === 'default' ? await TokensLib[chains[this.props.chain].ccLibVersion === 1 ? 'V1' : 'V2'].createTxAndAddNormalInputs(Number(tokens[i].supply) + 10000 + 10000, this.props.address.pubkey) : await Blockchain.createCCTx(Number(tokens[i].supply) + 10000 + 10000, this.props.address.pubkey);
        }
        
        if (window.DEBUG) {
          console.warn('create tx modal inputsData', inputsData);
        }

        const createTxFunc = chains[this.props.chain].ccLibVersion === 1 ? TokensLib.V1.createTokenTx : tokens[i].nft.indexOf('{') > -1 ? TokensLib.V2.createTokenTxTokel : TokensLib.V2.createTokenTx;
        console.warn('createTxFunc', createTxFunc)
        const createTxPayload = tokens[i].nft.length > 0 ? {
          name: tokens[i].name, 
          description: tokens[i].description,
          supply: Number(tokens[i].supply),
          nft: chains[this.props.chain].ccLibVersion === 1 ? (tokens[i].nft.indexOf('{') > -1 ? 'f7' : '00') : tokens[i].nft.indexOf('{') > -1 ? formatNftData(tokens[i].nft) : '00' + Buffer.from(tokens[i].nft).toString('hex'),
        } : {
          name: tokens[i].name, 
          description: tokens[i].description,
          supply: Number(tokens[i].supply),
        };
        console.warn('createTxPayload', createTxPayload);
        rawtx = await createTxFunc(
          inputsData,
          createTxPayload,
          this.props.wif
        );

        if (window.DEBUG) {
          console.warn('createNewToken rawtx', rawtx);
        }

        if (rawtx && rawtx.substr(0, 2) === '04') {
          //const txid = 'eea164a024dd72fa41de54f400e090cd93e6327005e8148720b674f5e43dd044';
          const {txid} = await Blockchain.broadcast(rawtx);
          /*this.setState({
            success: '123',
            error: null,
            currentTokenName: tokens[i].name,
            currentTokenNumber: this.state.currentTokenNumber + 1,
          });*/

          if (!txid || txid.length !== 64) {
            this.setState({
              success: null,
              error: 'Unable to broadcast transaction!',
            });
          } else {
            this.setState({
              success: txid,
              error: null,
              currentTokenName: tokens[i].name,
              currentTokenNumber: this.state.currentTokenNumber + 1,
              totalTokens: tokens.length,
              inProgress: true,
            });

            this.checkTxConfs(txid);
          }
        } else {
          this.setState({
            success: null,
            error: 'Unable to create transaction!',
          });
        }
      } catch (e) {
        this.setState({
          success: null,
          error: e.message,
        });
      }
    } else {
      this.setState({
        success: true,
        inProgress: false,
        batchJson: null,
      });
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
          className={`token-tile create-new-trigger${this.getMaxSupply() === 0 ? ' disabled' : ''}`}
          onClick={() => this.open()}>
          <i className="fa fa-plus"></i>
          Batch Create
        </div>
        <Modal
          show={this.state.isClosed === false}
          handleClose={() => this.close()}
          isCloseable={true}
          className="Modal-create-token">
          <div className="create-token-form">
            <h4>Batch token create</h4>
            <p>Provide tokens list JSON in the form below</p>
            <div className="input-form">
              <textarea
                rows="5"
                cols="33"
                name="batchJson"
                placeholder="Tokens list in JSON format"
                value={this.state.batchJson}
                onChange={this.updateInput}
                disabled={this.state.inProgress === true}>
              </textarea>
              <p>
                JSON format example:
                <pre style={{'textAlign': 'left', 'marginTop': '5px', 'whiteSpace': 'break-spaces'}}>
                  {JSON.stringify(jsonFormatExample, null, 2)}
                </pre>
              </p>
              <button
                type="button"
                onClick={this.createNewTokenBatch}
                disabled={
                  !this.state.batchJson ||
                  this.getMaxSupply() === 0 ||
                  this.state.inProgress === true
                }>Create</button>
              {this.state.success &&
               this.state.inProgress === true &&
                <div className="success">
                  Token <strong style={{'display': 'inline-block'}}>{this.state.currentTokenName}</strong> ({this.state.currentTokenNumber} of {this.state.totalTokens}) created!
                  <div className="txid-label" style={{'paddingBottom': '20px'}}>
                    <strong>Transaction ID:</strong> {this.state.success}
                  </div>
                  <a
                    href={`${chains[this.props.chain].explorerUrl}/${this.state.success}/transactions/${this.props.chain}`}
                    target="_blank">Open on explorer</a>
                  <p>Awaiting confirmations...</p>
                </div>
              }
              {this.state.success &&
               this.state.inProgress === false &&
                <div className="success">
                  All tokens are created!
                  <p>{this.state.totalTokens} in total</p>
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

export default BatchCreateTokenModal;