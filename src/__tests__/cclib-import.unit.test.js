import cclib from '../cclib-import';

test('it should check if all required cclib methods are imported', async () => {
  expect(cclib.hasOwnProperty('V1')).toBe(true);
  expect(cclib.hasOwnProperty('V2')).toBe(true);
  expect(cclib.hasOwnProperty('V2Assets')).toBe(true);

  // v1
  expect(cclib.V1.hasOwnProperty('createTokenTx')).toBe(true);
  expect(typeof cclib.V1.createTokenTx).toBe('function');
  expect(cclib.V1.hasOwnProperty('transferTokenTx')).toBe(true);
  expect(typeof cclib.V1.transferTokenTx).toBe('function');
  expect(cclib.V1.hasOwnProperty('keyToCCAddress')).toBe(true);
  expect(typeof cclib.V1.keyToCCAddress).toBe('function');
  expect(cclib.V1.hasOwnProperty('keyToWif')).toBe(true);
  expect(typeof cclib.V1.keyToWif).toBe('function');
  expect(cclib.V1.hasOwnProperty('createTxAndAddNormalInputs')).toBe(true);
  expect(typeof cclib.V1.createTxAndAddNormalInputs).toBe('function');
  expect(cclib.V1.hasOwnProperty('TransactionBuilder')).toBe(true);
  expect(typeof cclib.V1.TransactionBuilder).toBe('function');

  // v2
  expect(cclib.V2.hasOwnProperty('createTokenTx')).toBe(true);
  expect(typeof cclib.V2.createTokenTx).toBe('function');
  expect(cclib.V2.hasOwnProperty('createTokenTxTokel')).toBe(true);
  expect(typeof cclib.V2.createTokenTxTokel).toBe('function');
  expect(cclib.V2.hasOwnProperty('transferTokenTx')).toBe(true);
  expect(typeof cclib.V2.transferTokenTx).toBe('function');
  expect(cclib.V2.hasOwnProperty('keyToCCAddress')).toBe(true);
  expect(typeof cclib.V2.keyToCCAddress).toBe('function');
  expect(cclib.V2.hasOwnProperty('keyToWif')).toBe(true);
  expect(typeof cclib.V2.keyToWif).toBe('function');
  expect(cclib.V2.hasOwnProperty('createTxAndAddNormalInputs')).toBe(true);
  expect(typeof cclib.V2.createTxAndAddNormalInputs).toBe('function');
  expect(cclib.V2.hasOwnProperty('TransactionBuilder')).toBe(true);
  expect(typeof cclib.V2.TransactionBuilder).toBe('function');

  // v2 assets
  expect(cclib.V2Assets.hasOwnProperty('buildTokenv2ask')).toBe(true);
  expect(typeof cclib.V2Assets.buildTokenv2ask).toBe('function');
  expect(cclib.V2Assets.hasOwnProperty('buildTokenv2bid')).toBe(true);
  expect(typeof cclib.V2Assets.buildTokenv2bid).toBe('function');
  expect(cclib.V2Assets.hasOwnProperty('buildTokenv2fillask')).toBe(true);
  expect(typeof cclib.V2Assets.buildTokenv2fillask).toBe('function');
  expect(cclib.V2Assets.hasOwnProperty('buildTokenv2fillbid')).toBe(true);
  expect(typeof cclib.V2Assets.buildTokenv2fillbid).toBe('function');
  expect(cclib.V2Assets.hasOwnProperty('buildTokenv2cancelask')).toBe(true);
  expect(typeof cclib.V2Assets.buildTokenv2cancelask).toBe('function');
  expect(cclib.V2Assets.hasOwnProperty('buildTokenv2cancelbid')).toBe(true);
  expect(typeof cclib.V2Assets.buildTokenv2cancelbid).toBe('function');
});