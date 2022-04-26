import coinselect from 'coinselect';
import blockchain from './blockchain';
import TokensLib from './cclib-import';
import writeLog from './log';

const getUtxosRawTx = async utxos => {
  let rawTx = [];

  for (const utxo of utxos) {
    const {rawtx} = await blockchain.getRawTransaction(utxo.txid);
    writeLog(rawtx)
    rawTx.push(rawtx);
  }

  return rawTx;
};

export const utxoSelectNormal = (address, value, ccLibFormat, ccLibVersion) => {
  return new Promise(async(resolve, reject) => {
    const targets = [{
      address,
      value,
    }];
    let utxos = JSON.parse(JSON.stringify(await blockchain.getNormalUtxos(address)));
    writeLog('targets', targets);
    writeLog('utxoSelectNormal', utxos);

    for (let i = 0; i < utxos.length; i++) {
      utxos[i].value = utxos[i].satoshis;
      delete utxos[i].satoshis;
    }
    writeLog('utxoSelectNormal', utxos);
    
    const coinSelectData = coinselect(utxos, targets, 0);
    writeLog('coinSelectData', coinSelectData);

    const utxoSum = coinSelectData.inputs.reduce((acc, input) => acc + input.value, 0);
    writeLog('utxoSum', utxoSum);

    // TODO: check that utxo sum is less than target value
    if (ccLibFormat) {
      const tx = new TokensLib[ccLibVersion === 1 ? 'V1' : 'V2'].TransactionBuilder(TokensLib[ccLibVersion === 1 ? 'V1' : 'V2'].mynetwork);
      tx.setVersion(4);
      tx.setVersionGroupId(2301567109);

      for (let i = 0; i < coinSelectData.inputs.length; i++) {
        tx.addInput(coinSelectData.inputs[i].txid, coinSelectData.inputs[i].vout);
      }

      writeLog(tx.buildIncomplete().toHex());

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

export const utxoSelectCC = (address, tokenId, ccLibFormat, ccLibVersion) => {
  return new Promise(async(resolve, reject) => {
    let utxos = JSON.parse(JSON.stringify(await blockchain.tokenUtxos(address, tokenId, true)));
    writeLog('utxoSelectCC', utxos);
    writeLog('utxoSelectCC ccLibVersion', ccLibVersion)

    if (ccLibFormat) {
      const tx = new TokensLib[ccLibVersion === 1 ? 'V1' : 'V2'].TransactionBuilder(TokensLib[ccLibVersion === 1 ? 'V1' : 'V2'].mynetwork);
      let rawTx = [];
      tx.setVersion(4);
      tx.setVersionGroupId(2301567109);

      for (let i = 0; i < utxos.length; i++) {
        tx.addInput(utxos[i].txid, utxos[i].vout);
        rawTx.push(utxos[i].hex);
      }

      writeLog(tx.buildIncomplete().toHex());

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