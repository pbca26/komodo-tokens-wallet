// TODO: rewrite as class
let explorerUrl, _fetch, _headers = typeof window === 'undefined' ? null : Headers;

const setExplorerUrl = name => {
  explorerUrl = name;
};

const setFetch = (fetchRef, headers) => {
  _fetch = fetchRef;
  _headers = headers;
};

const get = async (endpoint, postData) => {
  const opts = {};

  if (postData) {
    opts.body = JSON.stringify(postData);
    opts.headers = new _headers();
    opts.headers.append('Content-Type', 'application/json');
    opts.headers.append('Content-Length', opts.body.length);
    opts.method = 'POST';
  }

  const response = await _fetch(`${explorerUrl}${endpoint}`, opts);
  const isJson = response.headers.get('Content-Type').includes('application/json');

  const body = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(body);
  }

  return body;
};

const getAddress = address => get(`addr/${address}/?noTxList=1`);

const getAddressHistory = address => get(`/txs?address=${address}`);

const getHistory = addresses => get(`addrs/txs`, {addrs: addresses.join(',')});

//const getUtxos = addresses => get(`addrs/utxo`, {addrs: addresses.join(',')});
const getNormalUtxos = address => get(`addr/${address}/utxo`);

const getTransaction = txid => get(`tx/${txid}`);

const getRawTransaction = txid => get(`rawtx/${txid}`);

const getBestBlockHash = () => get('status?q=getBestBlockHash');

const getBlock = blockHash => get(`block/${blockHash}`);

const getTipTime = async () => {
  const {bestblockhash} = await getBestBlockHash();
  const block = await getBlock(bestblockhash);

  return block.time;
};

const broadcast = transaction => get('tx/send', {rawtx: transaction});

const getInfo = async () => {
  try {
    const response = await fetch(`${explorerUrl}/status?q=getInfo`);
    const isJson = response.headers.get('Content-Type').includes('application/json');

    const body = isJson ? await response.json() : await response.text();
    
    if (!response.ok) {
      throw new Error(body);
    }

    return body;
  } catch (e) {
    return null;
  }
};

const tokenBalance = address => get(`tokens/balance?address=${address}`);
const tokenTransactions = address => get(`tokens/transactions?address=${address}`);
const tokenList = cctxid => cctxid ? get('tokens', {cctxid}) : get('tokens');
const tokenListAll = () => get('tokens?pageNum=all');
const tokenOrderbook = address => address ? get(`tokens/orderbook?address=${address}`) : get('tokens/orderbook');
const addCCInputs = (tokenid, pubkey, amount) => get(`tokens/addccinputs?pubkey=${pubkey}&tokenid=${tokenid}&amount=${amount}`);
const createCCTx = (amount, pubkey) => get(`tokens/createtx?pubkey=${pubkey}&amount=${amount}`);
const tokenUtxos = (address, tokenid, raw = false) => get(`tokens/utxo?address=${address}&cctxid=${tokenid}&raw=${raw}`)
const tokenTransactionsMany = (txid1, txid2) => get(`tokens/transactionsmany?txid1=${txid1}&txid2=${txid2}`);

const blockchain = {
  get,
  getInfo,
  getAddress,
  getAddressHistory,
  getHistory,
  getTransaction,
  getRawTransaction,
  getBestBlockHash,
  getBlock,
  getTipTime,
  broadcast,
  setExplorerUrl,
  setFetch,
  tokenBalance,
  tokenTransactions,
  tokenList,
  tokenListAll,
  getNormalUtxos,
  addCCInputs,
  createCCTx,
  tokenUtxos,
  tokenTransactionsMany,
  tokenOrderbook,
};

module.exports = blockchain;