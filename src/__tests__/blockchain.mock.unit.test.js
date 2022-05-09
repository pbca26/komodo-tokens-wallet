import 'regenerator-runtime/runtime';

import mockFetch from '../__mocks__/fetch';
import blockchain from '../blockchain';

import blokchainMockJson from '../__mocks__/blockchain.json';

global.fetch = mockFetch;

blockchain.setExplorerUrl('');

it('should return getInfo (explorer API)', async() => {
  const res = await blockchain.getInfo();

  expect(res).toBe(blokchainMockJson.getInfo);
});

it('should return getNormalUtxos (explorer API)', async() => {
  const res = await blockchain.getNormalUtxos();

  expect(res).toBe(blokchainMockJson.utxo);
});

it('should return tokenList (explorer API)', async() => {
  const res = await blockchain.tokenList();

  expect(res).toBe(blokchainMockJson.tokens);
});

it('should return tokenList (explorer API)', async() => {
  const res = await blockchain.tokenList();

  expect(res).toBe(blokchainMockJson.tokens);
});

it('should return tokenBalance (explorer API)', async() => {
  const res = await blockchain.tokenBalance();

  expect(res).toBe(blokchainMockJson.balance);
});

it('should return tokenTransactions (explorer API)', async() => {
  const res = await blockchain.tokenTransactions();

  expect(res).toBe(blokchainMockJson.transactions);
});

it('should return tokenOrderbook (explorer API)', async() => {
  const res = await blockchain.tokenOrderbook();

  expect(res).toBe(blokchainMockJson.orderbook);
});

it('should return addCCInputs (explorer API)', async() => {
  const res = await blockchain.addCCInputs();

  expect(res).toBe(blokchainMockJson.createToken.fixedSupplyToken.chainData);
});

it('should return createCCTx (explorer API)', async() => {
  const res = await blockchain.createCCTx();

  expect(res).toBe(blokchainMockJson.createtx);
});

it('should return tokenUtxos (explorer API)', async() => {
  const res = await blockchain.tokenUtxos();

  expect(res).toBe(blokchainMockJson.ccUtxo);
});

it('should return tokenTransactionsMany (explorer API)', async() => {
  const res = await blockchain.tokenTransactionsMany();

  expect(res).toBe(blokchainMockJson.transactionsMany);
});

it('should return broadcast transaction ID (explorer API)', async() => {
  const res = await blockchain.broadcast();

  expect(res).toBe('1111111111111111111111111111111111111111111111111111111111111111');
});