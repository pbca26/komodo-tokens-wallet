import React, {useState, useEffect} from 'react';
import Modal from './Modal';
import TokensLib from './cclib-import';
import Blockchain from './blockchain';
import {chains, nftDataTypes} from './constants';
import {utxoSelectNormal} from './utxo-select';
import {getMaxSpendNormalUtxos} from './math';
import writeLog from './log';
import devVars from './dev';

const CreateTokenModal = props => {
  const initialState = {
    isClosed: true,
    name: devVars && devVars.create.name || '',
    description: devVars && devVars.create.description || '',
    supply: devVars && devVars.send.supply || 1,
    nft: devVars && devVars.send.nft || '',
    success: null,
    error: null,
    tokenDropdownOpen: false,
    nftDataType: 'plain', // plain|tokel
    nftDataTokelUrl: '',
    nftDataTokelId: '',
    nftDataTokelRoyalty: '',
    nftDataTokelArbitrary: '',
  };
  const [state, setState] = useState(initialState);

  const updateInput = e => {
    const regexUnicodeCheckPattern = new RegExp(/^[ -~]+$/);
    const regexUnicodeCheckPatternMultiline = new RegExp(/^[ -~]+$/m);
    let error;

    if (e.target.name === 'supply') {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    }

    if (e.target.name === 'nftDataTokelId' &&
        e.target.value.length) {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    }

    if (e.target.name === 'nftDataTokelRoyalty' &&
        e.target.value.length) {
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

    setState(prevState => ({
      ...prevState,
      [e.target.name]: e.target.value,
      error,
      success: null,
    }));
  }

  useEffect(() => {
    writeLog('create token modal state', state);
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

  const createNewToken = async () => {
    const maxSupply = getMaxSpendNormalUtxos(props.normalUtxos, 20000);
    // ref: https://stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url
    const regexCheckUrl = new RegExp('^(http[s]?:\\/\\/(www\\.)?|ftp:\\/\\/(www\\.)?|(www\\.)?){1}([0-9A-Za-z-\\.@:%_\+~#=]+)+((\\.[a-zA-Z]{2,3})+)(/(.)*)?(\\?(.)*)?');
    let rawtx;
    
    const testJSON = (data) => {
      try {
        JSON.parse(data);
        return true;
      } catch (e) {
        return false;
      }
    };

    if (Number(state.supply) > maxSupply ||
        Number(state.supply) < 1) {
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

      setState(prevState => ({
        ...prevState,
        success: null,
        error: 'Token supply must be between 1 and ' + maxSupply,
      }));
    } else if (
      state.nft &&
      state.nft.length &&
      state.nft.indexOf('{') > -1 &&
      !testJSON(state.nft)) {
      setState(prevState => ({
        ...prevState,
        error: 'Token NFT data is not correct JSON format',
        success: null,
      }));
    } else if (
      state.nftDataTokelUrl &&
      state.nftDataTokelUrl.length &&
      !regexCheckUrl.test(state.nftDataTokelUrl)) {
      setState(prevState => ({
        ...prevState,
        error: 'Token NFT data URL is not correct format',
        success: null,
      }));
    } else if (
      state.nftDataTokelRoyalty &&
      state.nftDataTokelRoyalty.length &&
      state.nftDataTokelRoyalty.indexOf('{') > -1 &&
      !testJSON(state.nftDataTokelRoyalty)) {
      setState(prevState => ({
        ...prevState,
        error: 'Token NFT Arbitrary data is not correct JSON format',
        success: null,
      }));
    } else {
      try {
        const {chain, address} = props;

        writeLog('create token modal txBuilderApi', chains[chain].txBuilderApi);
        let inputsData, nftData;

        if (state.nftDataType === 'tokel') {
          if (state.nftDataTokelUrl) {
            if (!nftData) nftData = {};
            nftData.url = state.nftDataTokelUrl;
          }

          if (state.nftDataTokelId) {
            if (!nftData) nftData = {};
            nftData.id = Number(state.nftDataTokelId);
          }

          if (state.nftDataTokelRoyalty) {
            if (!nftData) nftData = {};
            nftData.royalty = Number(state.nftDataTokelRoyalty);
          }

          if (state.nftDataTokelArbitrary) {
            if (!nftData) nftData = {};
            nftData.arbitrary = Buffer.from(state.nftDataTokelArbitrary).toString('hex');
          }

          if (Object.keys(nftData).length) nftData = JSON.stringify(nftData);
         } else {
          nftData = state.nft;
        }

        console.warn('create token modal txBuilderApi', chains[props.chain].txBuilderApi);
        console.warn('create token modal NFT data', nftData);
        
        if (chains[chain].txBuilderApi === 'utxoSelect') {
          inputsData = await utxoSelectNormal(
            address.normal,
            Number(state.supply) + 20000,
            true,
            chains[chain].ccLibVersion
          );
        } else {
          inputsData = chains[chain].txBuilderApi === 'default' ? await TokensLib[chains[chain].ccLibVersion === 1 ? 'V1' : 'V2'].createTxAndAddNormalInputs(Number(state.supply) + 10000 + 10000, address.pubkey) : await Blockchain.createCCTx(Number(state.supply) + 10000 + 10000, address.pubkey);
        }
        
        writeLog('create tx modal inputsData', inputsData);

        const createTxFunc = chains[chain].ccLibVersion === 1 ? TokensLib.V1.createTokenTx : state.nft.indexOf('{') > -1 ? TokensLib.V2.createTokenTxTokel : TokensLib.V2.createTokenTx;
        console.warn('createTxFunc', createTxFunc)
        const createTxPayload = nftData.length > 0 ? {
          name: state.name, 
          description: state.description,
          supply: Number(state.supply),
          nft: chains[props.chain].ccLibVersion === 1 ? (nftData.indexOf('{') > -1 ? 'f7' : '00') : nftData.indexOf('{') > -1 ? JSON.parse(nftData) : '00' + Buffer.from(nftData).toString('hex'),
        } : {
          name: state.name, 
          description: state.description,
          supply: Number(state.supply),
        };
        writeLog('createTxPayload', createTxPayload);
        rawtx = await createTxFunc(
          inputsData,
          createTxPayload,
          props.wif
        );
      } catch (e) {
        setState(prevState => ({
          ...prevState,
          success: null,
          error: e.message,
        }));
      }

      writeLog('createNewToken rawtx', rawtx);

      if (rawtx && rawtx.substr(0, 2) === '04') {
        const {txid} = await Blockchain.broadcast(rawtx);

        if (!txid || txid.length !== 64) {
          setState(prevState => ({
            ...prevState,
            success: null,
            error: 'Unable to broadcast transaction!',
          }));
        } else {
          setState(prevState => ({
            ...prevState,
            success: txid,
            error: null,
            name: '',
            description: '',
            supply: '',
          }));

          setTimeout(() => {
            props.syncData();
          }, 100);
        }
      } else {
        setState(prevState => ({
          ...prevState,
          success: null,
          error: 'Unable to create transaction!',
        }));
      }
    }
  }

  const getMaxSupply = () => {
    const normalUtxos = props.normalUtxos;
    let maxSupply = -20000; // maker + tx fee

    for (let i = 0; i < normalUtxos.length; i++) {
      maxSupply += normalUtxos[i].satoshis;
    }

    return maxSupply < 0 ? 0 : maxSupply;
  };

  const dropdownTrigger = e => {
    e.stopPropagation();

    setState(prevState => ({
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

  const handleClickOutside = e => {
    setState(prevState => ({
      ...prevState,
      tokenDropdownOpen: false,
    }));
  }

  const setNftDataType = nftDataType => {
    setState(prevState => ({
      ...prevState,
      nftDataType,
      nft: '',
      nftDataTokelUrl: '',
      nftDataTokelId: '',
      nftDataTokelRoyalty: '',
      nftDataTokelArbitrary: '',
    }));
  }

  const renderNFTDataForm = () => {
    return (
      <React.Fragment>
        <div className={`dropdown${state.tokenDropdownOpen ? ' is-active' : ''}`}>
          <div className={`dropdown-trigger${state.token ? ' highlight' : ''}`}>
            <button
              className="button"
              onClick={dropdownTrigger}>
              <span>{nftDataTypes[state.nftDataType]}</span>
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
              {Object.keys(nftDataTypes).map(dataTypeItem => (
                <a
                  key={`nft-data-type-${dataTypeItem}`}
                  className="dropdown-item"
                  onClick={() => setNftDataType(dataTypeItem)}>
                  <span className="dropdown-balance">{nftDataTypes[dataTypeItem]}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
        {state.nftDataType === 'plain' &&
          <textarea
            rows="5"
            cols="33"
            name="nft"
            placeholder="Token NFT data (optional)"
            value={state.nft}
            onChange={updateInput}>
          </textarea>
        }
        {state.nftDataType === 'tokel' &&
          <React.Fragment>
            <input
              type="text"
              name="nftDataTokelUrl"
              placeholder="Token NFT Data URL"
              value={state.nftDataTokelUrl}
              onChange={updateInput} />
            <input
              type="text"
              name="nftDataTokelId"
              placeholder="Token NFT Data ID"
              value={state.nftDataTokelId}
              onChange={updateInput} />
            <input
              type="text"
              name="nftDataTokelRoyalty"
              placeholder="Token NFT Data Royalty"
              value={state.nftDataTokelRoyalty}
              onChange={updateInput} />
            <textarea
              rows="5"
              cols="33"
              name="nftDataTokelArbitrary"
              placeholder="Token NFT Data Arbitrary"
              value={state.nftDataTokelArbitrary}
              onChange={updateInput}>
            </textarea>
          </React.Fragment>
        }
      </React.Fragment>
    );
  }

  const render = () => {
    const maxSupply = getMaxSpendNormalUtxos(props.normalUtxos, 20000);
    const {chain} = props;

    return (
      <React.Fragment>
        <div
          className={`token-tile create-new-trigger${maxSupply === 0 ? ' disabled' : ''}`}
          onClick={() => open()}>
          <i className="fa fa-plus"></i>
          Create
        </div>
        <Modal
          show={state.isClosed === false}
          handleClose={() => close()}
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
                value={state.name}
                onChange={updateInput} />
              <input
                type="text"
                name="supply"
                placeholder="Token supply"
                value={state.supply}
                onChange={updateInput} />
              <textarea
                rows="5"
                cols="33"
                name="description"
                placeholder="Token description"
                value={state.description}
                onChange={updateInput}>
              </textarea>
              {renderNFTDataForm()}
              <button
                type="button"
                onClick={createNewToken}
                disabled={
                  !state.name ||
                  !state.supply ||
                  maxSupply === 0
                }>Create</button>
              {state.success &&
                <div className="success">
                  Token created!
                  <div className="txid-label">
                    <strong>Transaction ID:</strong> {state.success}
                  </div>
                  <a
                    href={`${chains[chain].explorerUrl}/${state.success}/transactions/${chain}`}
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

export default CreateTokenModal;
