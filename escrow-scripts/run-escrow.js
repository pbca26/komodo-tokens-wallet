const fetch = require('node-fetch');
const {Headers} = require('node-fetch');
const config = require('./config');
const bitgoLib = require('./bitgo-utxo-lib/samples/cctokenspocv2');
const blockchain = require('../src/blockchain');
const utxoLib = require('./utxo-select');

const RUN_INTERVAL = 120 * 1000;

blockchain.setFetch(fetch, Headers);

const log = (...arg) => console.log(...arg);
const Escrow = require('./escrow');
const escrow = new Escrow(config, bitgoLib, blockchain, utxoLib, log);

escrow.run();

setInterval(() => {
  escrow.run();
}, RUN_INTERVAL);