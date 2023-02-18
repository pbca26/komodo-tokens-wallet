import React, {useState, useEffect} from 'react';
import Modal from './Modal';
import TokensLib from './cclib-import';
import Blockchain from './blockchain';
import {chains} from './constants';
import {utxoSelectNormal} from './utxo-select';
import writeLog from './log';
import {BatchCreateTokenModalProps} from './types';

const jsonFormatExample = [{
  'name': 'token1',
  'supply': 1,
  'description': 'Some description',
  'nft': '{\"url\": \"someurl\", \"id\": 1, \"royalty\": 10, \"arbitrary\": {\"some key\":\"some prop\"}}'
}];

let checkTxConfsTimer: ReturnType<typeof setTimeout>;

const BatchCreateTokenModal: React.FC<BatchCreateTokenModalProps> = props => {
  const initialState: any = {
    isClosed: true,
    batchJson: null,
    currentTokenNumber: 0,
    currentTokenName: null,
    totalTokens: 0,
    success: null,
    error: null,
    inProgress: -1,
  };
  const [state, setState] = useState(initialState);

  const checkTxConfs = async (txid: string) => {
    try {
      const txData = await Blockchain.getTransaction(txid);
      writeLog('txData', txData);

      if (txData && txData.confirmations && Number(txData.confirmations) >= 1) {
        writeLog(txid, 'is confirmed');
        props.syncData();
        if (checkTxConfsTimer) clearTimeout(checkTxConfsTimer);
        createNewTokenBatch(true);
      } else {
        checkTxConfsTimer = setTimeout(() => {
          checkTxConfs(txid);
        }, 5000);
      }
    } catch (e) {
      writeLog('error fetching confs data, retry', e);
      checkTxConfsTimer = setTimeout(() => {
        checkTxConfs(txid);
      }, 5000);
    }
  };

  const updateInput = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    setState((prevState: any) => ({
      ...prevState,
      [e.target.name]: e.target.value,
      error: null,
      success: null,
    }));
  }

  useEffect(() => {
    writeLog('sell token modal state', state);
  });

  const close = () => {
    setState({
      ...initialState,
      isClosed: true,
    });
  }

  const open = () => {
    if (props.normalUtxos.length)
      setState({
        ...initialState,
        isClosed: false,
      });
  }

  const createNewTokenBatch = async (isAuto?: boolean) => {
    const tokens = JSON.parse(state.batchJson);
    const i = state.currentTokenNumber;
    let rawtx;
    //writeLog(tokens);
    //writeLog(typeof tokens);

    if (!isAuto) {
      setState((prevState: any) => ({
        ...prevState,
        success: null,
        error: null,
        currentTokenName: null,
        currentTokenNumber: 0,
        totalTokens: 0,
      }));
    }

    const formatNftData = (data: any) => {
      let _data = JSON.parse(data);

      if (_data.arbitrary) {
        if (typeof _data.arbitrary === 'object' || Array.isArray(_data.arbitrary)) {
          _data.arbitrary = Buffer.from(JSON.stringify(_data.arbitrary)).toString('hex');
        } else if (/^[A-F0-9]+$/i.test(_data.arbitrary)) {
          // hex string, do nothing
          //writeLog('arbitrary is a hex str');
        } else {
          _data.arbitrary = Buffer.from(_data.arbitrary.toString()).toString('hex');
        }
      }
      
      return _data;
    };

    if (i < tokens.length) {
      writeLog('token name', tokens[i].name);
      writeLog('token nft', tokens[i].nft);

      try {
        let inputsData;

        writeLog('create token modal txBuilderApi', chains[props.chain].txBuilderApi);
        
        if (chains[props.chain].txBuilderApi === 'utxoSelect') {
          inputsData = await utxoSelectNormal(props.address.normal, Number(tokens[i].supply) + 20000, true, chains[props.chain].ccLibVersion);
        } else {
          inputsData = chains[props.chain].txBuilderApi === 'default' ? await TokensLib[chains[props.chain].ccLibVersion === 1 ? 'V1' : 'V2'].createTxAndAddNormalInputs(Number(tokens[i].supply) + 10000 + 10000, props.address.pubkey) : await Blockchain.createCCTx(Number(tokens[i].supply) + 10000 + 10000, props.address.pubkey);
        }
        
        if (window.DEBUG) {
          writeLog('create tx modal inputsData', inputsData);
        }

        //const createTxFunc = chains[props.chain].ccLibVersion === 1 ? TokensLib.V1.createTokenTx : tokens[i].nft.indexOf('{') > -1 ? TokensLib.V2.createTokenTxTokel : TokensLib.V2.createTokenTx;
        const createTxFunc = tokens[i].nft.indexOf('{') > -1 ? TokensLib.V2.createTokenTxTokel : TokensLib.V2.createTokenTx;
        writeLog('createTxFunc', createTxFunc)
        const createTxPayload = tokens[i].nft.length > 0 ? {
          name: tokens[i].name, 
          description: tokens[i].description,
          supply: Number(tokens[i].supply),
          nft: chains[props.chain].ccLibVersion === 1 ? (tokens[i].nft.indexOf('{') > -1 ? 'f7' : '00') : tokens[i].nft.indexOf('{') > -1 ? formatNftData(tokens[i].nft) : '00' + Buffer.from(tokens[i].nft).toString('hex'),
        } : {
          name: tokens[i].name, 
          description: tokens[i].description,
          supply: Number(tokens[i].supply),
        };
        writeLog('createTxPayload', createTxPayload);
        rawtx = await createTxFunc(
          inputsData,
          createTxPayload,
          props.wif
        );

        if (window.DEBUG) {
          writeLog('createNewToken rawtx', rawtx);
        }

        if (rawtx && rawtx.substr(0, 2) === '04') {
          //const txid = 'eea164a024dd72fa41de54f400e090cd93e6327005e8148720b674f5e43dd044';
          const {txid} = await Blockchain.broadcast(rawtx);
          /*setState(prevState => ({
            ...prevState,
            success: '123',
            error: null,
            currentTokenName: tokens[i].name,
            currentTokenNumber: state.currentTokenNumber + 1,
          });*/

          if (!txid || txid.length !== 64) {
            setState((prevState: any) => ({
              ...prevState,
              success: null,
              error: 'Unable to broadcast transaction!',
            }));
          } else {
            setState((prevState: any) => ({
              ...prevState,
              success: txid,
              error: null,
              currentTokenName: tokens[i].name,
              currentTokenNumber: state.currentTokenNumber + 1,
              totalTokens: tokens.length,
              inProgress: true,
            }));

            checkTxConfs(txid);
          }
        } else {
          setState((prevState: any) => ({
            ...prevState,
            success: null,
            error: 'Unable to create transaction!',
          }));
        }
      } catch (e) {
        setState((prevState: any) => ({
          ...prevState,
          success: null,
          error: e.message,
        }));
      }
    } else {
      setState((prevState: any) => ({
        ...prevState,
        success: true,
        inProgress: false,
        batchJson: null,
      }));
    }

    return;
  }

  const getMaxSupply = () => {
    const normalUtxos = props.normalUtxos;
    let maxSupply = -20000; // maker + tx fee

    for (let i = 0; i < normalUtxos.length; i++) {
      maxSupply += normalUtxos[i].satoshis;
    }

    return maxSupply < 0 ? 0 : maxSupply;
  };

  const render = () => {
    return (
      <React.Fragment>
        <div
          className={`token-tile create-new-trigger${getMaxSupply() === 0 ? ' disabled' : ''}`}
          onClick={() => open()}>
          <i className="fa fa-plus"></i>
          Batch Create
        </div>
        <Modal
          show={state.isClosed === false}
          handleClose={() => close()}
          isCloseable={true}
          className="Modal-create-token">
          <div className="create-token-form">
            <h4>Batch token create</h4>
            <p>Provide tokens list JSON in the form below</p>
            <div className="input-form">
              <textarea
                rows={5}
                cols={33}
                name="batchJson"
                placeholder="Tokens list in JSON format"
                value={state.batchJson}
                onChange={updateInput}
                disabled={state.inProgress === true}>
              </textarea>
              <p>
                JSON format example:
                <pre style={{'textAlign': 'left', 'marginTop': '5px', 'whiteSpace': 'break-spaces'}}>
                  {JSON.stringify(jsonFormatExample, null, 2)}
                </pre>
              </p>
              <button
                type="button"
                onClick={() => createNewTokenBatch()}
                disabled={
                  !state.batchJson ||
                  getMaxSupply() === 0 ||
                  state.inProgress === true
                }>Create</button>
              {state.success &&
               state.inProgress === true &&
                <div className="success">
                  Token <strong style={{'display': 'inline-block'}}>{state.currentTokenName}</strong> ({state.currentTokenNumber} of {state.totalTokens}) created!
                  <div className="txid-label" style={{'paddingBottom': '20px'}}>
                    <strong>Transaction ID:</strong> {state.success}
                  </div>
                  <a
                    href={`${chains[props.chain].explorerUrl}/${state.success}/transactions/${props.chain}`}
                    target="_blank">Open on explorer</a>
                  <p>Awaiting confirmations...</p>
                </div>
              }
              {state.success &&
               state.inProgress === false &&
                <div className="success">
                  All tokens are created!
                  <p>{state.totalTokens} in total</p>
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

export default BatchCreateTokenModal;