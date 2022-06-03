import mockData from './blockchain.json';

const mockFetch = jest.fn((url) => {
  console.log('fetch url', url);

  return Promise.resolve({
    json: () => {
      if (url.indexOf('status?q=getInfo') > -1) {
        return mockData.getInfo;
      } if (url.indexOf('tx/send') > -1) {
        return {txid: '1111111111111111111111111111111111111111111111111111111111111111'};
      } if (url.indexOf('rawtx') > -1) {
        if (url.indexOf('/')) {
          const temp = url.split('/');
          return mockData.rawtx[temp[1]];
        }

        return mockData.rawtx['890a375c18cbc420d3293dbd661f557caf5e4ca43c770cf479bcc9cfe14b9cbd'];
      } else if (url.indexOf('addr/undefined/utxo') > -1 || url.indexOf('addr/RRF6ocq94kLpaH6wPdZjTqQa9mAmT1GToc/utxo') > -1) {
        return mockData.utxo;
      } else if (url === 'tokens' || url === 'tokens?pageNum=all') {
        return mockData.tokens;
      } else if (url.indexOf('tokens/balance') > -1) {
        return mockData.balance;
      } else if (url.indexOf('transactions?address=undefined') > -1 || url.indexOf('transactions?address=CaopajuemreFwEAfbywvFi8oFyrJPNkDs1') > -1) {
        return mockData.transactions;
      } else if (url.indexOf('tokens/orderbook') > -1) {
        return mockData.orderbook;
      } else if (url.indexOf('tokens/createtx') > -1) {
        if (url.indexOf('tokens/createtx?pubkey=03256ba44eeb188404b94ae8ed64f1fe6ad89580375830845361e365598efa3ff3&amount=10000') > -1) {
          return mockData.cancelAsk.createtx;
        } else if (url.indexOf('tokens/createtx?pubkey=03256ba44eeb188404b94ae8ed64f1fe6ad89580375830845361e365598efa3ff3&amount=11000') > -1) {
          return mockData.sellToken.createtx;
        }
        return mockData.createtx;
      } else if (url.indexOf('tokens/addccinputs') > -1) {
        if (url.indexOf('tokens/addccinputs?pubkey=03256ba44eeb188404b94ae8ed64f1fe6ad89580375830845361e365598efa3ff3&tokenid=7e2b623cb57b44b8dc5d3a3cc36c20d08f66023a85fa2a4490a8fb8783d38347&amount=1') > -1) {
          return mockData.sellToken.addccinputs;
        }
        return mockData.createToken.fixedSupplyToken.chainData;
      } else if (url.indexOf('tokens/utxo') > -1) {
        return mockData.ccUtxo;
      } else if (url.indexOf('tokens/transactionsmany?txid1') > -1) {
        if (url.indexOf('tokens/transactionsmany?txid1=b8ceac7c2130b9a44fd11a1b67f4fa7b7a908b9f9a58e4f0024acd3b486b7a90&txid2=572663bb71d9822cf70d60ed4d180300f61bf8790dc5c2023d1888f1b8e8c254') > -1) {
          return mockData.cancelAsk.transactionsmany;
        }
        return mockData.transactionsMany;
      }
    },
    headers: {
      get: () => {
        return 'application/json';
      },
    },
    ok: true,
  });
});

export const mockHeaders = () => {
  return {
    append: () => {}
  };
};

export default mockFetch;