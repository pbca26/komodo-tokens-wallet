// TODO: refactor and use src/utxo-select.js

const coinselect = require('coinselect');
const blockchain = require('../src/blockchain');
const TokensLib = {
  V2: require('./bitgo-utxo-lib/samples/cctokenspocv2')
};
const ccLibVersion = 2;

const getUtxosRawTx = async utxos => {
  let rawTx = [];

  for (const utxo of utxos) {
    const {rawtx} = await blockchain.getRawTransaction(utxo.txid);
    console.warn(rawtx)
    rawTx.push(rawtx);
  }

  return rawTx;
};

const utxoSelectNormal = (address, value, ccLibFormat, ccLibVersion) => {
  return new Promise(async(resolve, reject) => {
    const targets = [{
      address,
      value,
    }];
    let utxos = await blockchain.getNormalUtxos(address);
    console.warn('targets', targets);
    console.warn('utxoSelectNormal', utxos);

    for (let i = 0; i < utxos.length; i++) {
      utxos[i].value = utxos[i].satoshis;
      delete utxos[i].satoshis;
    }
    console.warn('utxoSelectNormal', utxos);
    
    const coinSelectData = coinselect(utxos, targets, 0);
    console.warn('coinSelectData', coinSelectData);

    const utxoSum = coinSelectData.inputs.reduce((acc, input) => acc + input.value, 0);
    console.warn('utxoSum', utxoSum);

    // TODO: check that utxo sum is less than target value

    if (ccLibFormat) {
      const tx = new TokensLib[ccLibVersion === 1 ? 'V1' : 'V2'].TransactionBuilder(TokensLib[ccLibVersion === 1 ? 'V1' : 'V2'].mynetwork);
      tx.setVersion(4);
      tx.setVersionGroupId(2301567109);

      for (let i = 0; i < coinSelectData.inputs.length; i++) {
        tx.addInput(coinSelectData.inputs[i].txid, coinSelectData.inputs[i].vout);
      }

      console.warn(tx.buildIncomplete().toHex());

      const rawtTx = await getUtxosRawTx(coinSelectData.inputs);

      resolve({
        txhex: tx.buildIncomplete().toHex(),
        previousTxns: rawtTx,
      });
    } else {
      resolve(coinSelectData);
    }
  });
};

const utxoSelectCC = (address, tokenId, ccLibFormat, ccLibVersion) => {
  return new Promise(async(resolve, reject) => {
    let utxos = await blockchain.tokenUtxos(address, tokenId, true);
    console.warn('utxoSelectCC', utxos);
    console.warn('utxoSelectCC ccLibVersion', ccLibVersion)

    if (ccLibFormat) {
      const tx = new TokensLib[ccLibVersion === 1 ? 'V1' : 'V2'].TransactionBuilder(TokensLib[ccLibVersion === 1 ? 'V1' : 'V2'].mynetwork);
      let rawTx = [];
      tx.setVersion(4);
      tx.setVersionGroupId(2301567109);

      for (let i = 0; i < utxos.length; i++) {
        tx.addInput(utxos[i].txid, utxos[i].vout);
        rawTx.push(utxos[i].hex);
      }

      console.warn(tx.buildIncomplete().toHex());

      resolve({
        //evalcodeNFT: 245,
        txhex: tx.buildIncomplete().toHex(),
        previousTxns: rawTx,
      });
    } else {
      resolve(utxos);
    }
  });
};

module.exports = {
  utxoSelectNormal,
  utxoSelectCC,
};