// TODO: rewrite as class
let explorerUrl: string, _fetch = typeof window === 'undefined' ? null : fetch, _headers = typeof window === 'undefined' ? null : Headers;

const setExplorerUrl = (name?: string) => {
  explorerUrl = name;
};

const setFetch = (fetchRef: any, headers: any) => {
  _fetch = fetchRef;
  _headers = headers;
};

const get = async (endpoint: string, postData?: any) => {
  const opts: any = {};

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

const getAddress = (address: string) => get(`addr/${address}/?noTxList=1`);

const getAddressHistory = (address: string) => get(`/txs?address=${address}`);

const getHistory = (addresses: string[]) => get(`addrs/txs`, {addrs: addresses.join(',')});

//const getUtxos = (address: string) => get(`addrs/utxo`, {addrs: addresses.join(',')});
const getNormalUtxos = (address: string) => get(`addr/${address}/utxo`);

const getTransaction = (txid: string) => get(`tx/${txid}`);

const getRawTransaction = (txid: string) => get(`rawtx/${txid}`);

const getBestBlockHash = () => get('status?q=getBestBlockHash');

const getBlock = (blockHash: string) => get(`block/${blockHash}`);

const getTipTime = async () => {
  const {bestblockhash} = await getBestBlockHash();
  const block = await getBlock(bestblockhash);

  return block.time;
};

const broadcast = (transaction: string) => get('tx/send', {rawtx: transaction});

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

const tokenBalance = (address: string) => get(`tokens/balance?address=${address}`);
const tokenTransactions = (address: string) => get(`tokens/transactions?address=${address}`);
const tokenList = (cctxid?: string | string[]) => cctxid ? get('tokens', {cctxid}) : get('tokens');
const tokenListAll = () => get('tokens?pageNum=all');
const tokenOrderbook = (address?: string) => address ? get(`tokens/orderbook?address=${address}`) : get('tokens/orderbook');
const addCCInputs = (tokenid: string, pubkey: string, amount: number) => get(`tokens/addccinputs?pubkey=${pubkey}&tokenid=${tokenid}&amount=${amount}`);
const createCCTx = (amount: number | string, pubkey: string) => get(`tokens/createtx?pubkey=${pubkey}&amount=${amount}`);
const tokenUtxos = (address: string, tokenid: string, raw = false) => get(`tokens/utxo?address=${address}&cctxid=${tokenid}&raw=${raw}`)
const tokenTransactionsMany = (txid1: string, txid2: string) => get(`tokens/transactionsmany?txid1=${txid1}&txid2=${txid2}`);
const raddressToCIndexKeys = (address: string) => get(`tokens/convertAddress?address=${address}`);

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
  raddressToCIndexKeys,
};

export default blockchain;