import {IChains} from './types';

export const chains: IChains = {
  TOKENSV2: {
    ccLibVersion: 1,
    faucetURL: 'https://www.atomicexplorer.com/#/faucet/tokensv2/',
    txBuilderApi: 'utxoSelect', // default|insight|utxoSelect
    explorerUrl: 'http://explorer.komodoplatform.com:20000/tokens',
    explorerApiUrl: 'https://explorer.komodoplatform.com:10000/tokensv2/api/',
    enabled: true,
  },
  TKLTEST: {
    ccLibVersion: 2,
    ccIndex: true,
    explorerApiVersion: 2,
    faucetURL: 'https://www.atomicexplorer.com/#/faucet/tkltest/',
    txBuilderApi: 'utxoSelect', // default|insight|utxoSelect
    explorerUrl: 'http://explorer.komodoplatform.com:20000/tokens',
    explorerApiUrl: 'https://explorer.komodoplatform.com:10000/tkltest/api/',
    enabled: true,
  },
  TKLTEST2: {
    ccLibVersion: 2,
    ccIndex: true,
    explorerApiVersion: 2,
    faucetURL: 'https://www.atomicexplorer.com/#/faucet/tkltest2/',
    txBuilderApi: 'utxoSelect', // default|insight|utxoSelect
    explorerUrl: 'http://explorer.komodoplatform.com:20000/tokens',
    explorerApiUrl: 'https://explorer.komodoplatform.com:10000/tkltest2/api/',
    enabled: true,
  },
  TKLTEST2R: {
    ccLibVersion: 2,
    ccIndex: true,
    explorerApiVersion: 2,
    faucetURL: 'https://www.atomicexplorer.com/#/faucet/tkltest2r/',
    txBuilderApi: 'utxoSelect', // default|insight|utxoSelect
    explorerUrl: 'http://explorer.komodoplatform.com:20000/tokens',
    explorerApiUrl: 'https://explorer.komodoplatform.com:10000/tkltest2r/api/',
    enabled: true,
    isRaddress: true,
  },
  TOKEL: {
    ccLibVersion: 2,
    ccIndex: true,
    txBuilderApi: 'utxoSelect', // default|insight|utxoSelect
    explorerUrl: 'http://explorer.komodoplatform.com:20000/tokens',
    explorerApiUrl: 'https://explorer.komodoplatform.com:10000/tokel/api/',
    explorerApiVersion: 2,
    enabled: window.location.href.indexOf('enable-tokel') > -1 ? true : false,
  },
};

export const nftDataTypes: { [key: string]: string } = {
  plain: 'Plain text or JSON',
  tokel: 'Tokel Standart',
};

export const orderType: Array<{ [char: string]: string }> = [{
  value: 'all',
  title: 'All orders',
}, {
  value: 'my',
  title: 'My orders',
}];

export const orderDirection: Array<{ [char: string]: string }> = [{
  value: 'all',
  title: 'All directions',
}, {
  value: 'sell',
  title: 'Sell orders',
}, {
  value: 'buy',
  title: 'Buy orders',
}];