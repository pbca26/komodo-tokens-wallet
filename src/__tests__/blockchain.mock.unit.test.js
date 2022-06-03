import 'regenerator-runtime/runtime';

import mockFetch, {mockHeaders} from '../__mocks__/fetch';
import blockchain from '../blockchain';

import blokchainMockJson from '../__mocks__/blockchain.json';

global.fetch = mockFetch;

blockchain.setFetch(mockFetch, mockHeaders);
blockchain.setExplorerUrl('');

it('should return getInfo (explorer API)', async() => {
  const res = await blockchain.getInfo();

  expect(res).toEqual(blokchainMockJson.getInfo);
});

it('should return getNormalUtxos (explorer API)', async() => {
  const res = await blockchain.getNormalUtxos();

  expect(res).toEqual(blokchainMockJson.utxo);
});

it('should return tokenList (explorer API)', async() => {
  const res = await blockchain.tokenList();

  expect(res).toEqual(blokchainMockJson.tokens);
});

it('should return tokenList (explorer API)', async() => {
  const res = await blockchain.tokenList();

  expect(res).toEqual(blokchainMockJson.tokens);
});

it('should return tokenBalance (explorer API)', async() => {
  const res = await blockchain.tokenBalance();

  expect(res).toEqual(blokchainMockJson.balance);
});

it('should return tokenTransactions (explorer API)', async() => {
  const res = await blockchain.tokenTransactions();

  expect(res).toEqual(blokchainMockJson.transactions);
});

it('should return tokenOrderbook (explorer API)', async() => {
  const res = await blockchain.tokenOrderbook();

  expect(res).toEqual(blokchainMockJson.orderbook);
});

it('should return addCCInputs (explorer API)', async() => {
  const res = await blockchain.addCCInputs();

  expect(res).toEqual(blokchainMockJson.createToken.fixedSupplyToken.chainData);
});

it('should return createCCTx (explorer API)', async() => {
  const res = await blockchain.createCCTx();

  expect(res).toEqual(blokchainMockJson.createtx);
});

it('should return tokenUtxos (explorer API)', async() => {
  const res = await blockchain.tokenUtxos();

  expect(res).toEqual(blokchainMockJson.ccUtxo);
});

it('should return tokenTransactionsMany (explorer API)', async() => {
  const res = await blockchain.tokenTransactionsMany();

  expect(res).toEqual(blokchainMockJson.transactionsMany);
});

it('should return broadcast transaction ID (explorer API)', async() => {
  const res = await blockchain.broadcast();

  expect(res).toEqual({txid: '1111111111111111111111111111111111111111111111111111111111111111'});
});