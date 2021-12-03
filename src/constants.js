const chains = {
  TOKENSV2: {
    ccLibVersion: 1,
    faucetURL: 'https://www.atomicexplorer.com/#/faucet/tokensv2/',
    txBuilderApi: 'utxoSelect', // default|insight|utxoSelect
    explorerUrl: 'http://explorer.komodoplatform.com:20000/tokens',
    explorerApiUrl: 'https://explorer.komodoplatform.com:10000/tokensv2/api/',
  },
  TKLTEST: {
    ccLibVersion: 2,
    ccIndex: true,
    faucetURL: 'https://www.atomicexplorer.com/#/faucet/tkltest/',
    txBuilderApi: 'utxoSelect', // default|insight|utxoSelect
    explorerUrl: 'http://explorer.komodoplatform.com:20000/tokens',
    explorerApiUrl: 'https://explorer.komodoplatform.com:10000/tkltest/api/',
  },
};

module.exports = {
  chains,
};