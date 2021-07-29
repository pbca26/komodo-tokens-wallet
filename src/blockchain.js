let explorerUrl;

const setExplorerUrl = (name) => {
  explorerUrl = name;
};

const get = async (endpoint, postData) => {
  const opts = {};

  if (postData) {
    opts.body = JSON.stringify(postData);
    opts.headers = new Headers();
    opts.headers.append('Content-Type', 'application/json');
    opts.headers.append('Content-Length', opts.body.length);
    opts.method = 'POST';
  }

  const response = await fetch(`${explorerUrl}${endpoint}`, opts);
  const isJson = response.headers.get('Content-Type').includes('application/json');

  const body = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(body);
  }

  return body;
};

const getAddress = address => get(`addr/${address}/?noTxList=1`);

const getAddressHistory = (address) => get(`/txs?address=${address}`);

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

export const getInfo = async (explorerUrl) => {
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
const tokenList = () => get('tokens');
const addCCInputs = (tokenid, pubkey, amount) => get(`tokens/addccinputs?pubkey=${pubkey}&tokenid=${tokenid}&amount=${amount}`);
const createCCTx = (amount, pubkey) => get(`tokens/createtx?pubkey=${pubkey}&amount=${amount}`);

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
  tokenBalance,
  tokenTransactions,
  tokenList,
  getNormalUtxos,
  addCCInputs,
  createCCTx,
};

export default blockchain;
