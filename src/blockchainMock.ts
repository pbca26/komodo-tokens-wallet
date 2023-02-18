import mockData from './blockchainMock.json';

const setExplorerUrl = () => {
  console.warn('use blockchain mock data');
};

// readonly API
const getAddress = (address: string) => {}; //get(`addr/${address}/?noTxList=1`);
const getAddressHistory = (address: string) => {}; //get(`/txs?address=${address}`);
const getHistory = (addresses: string[]) => {}; //get(`addrs/txs`, {addrs: addresses.join(',')});
const getNormalUtxos = (address: string) => mockData.utxo; //get(`addr/${address}/utxo`);
const getTransaction = (txid: string) => {}; //get(`tx/${txid}`);
const getRawTransaction = (txid: string) => {}; //get(`rawtx/${txid}`);
const getBestBlockHash = () => {}; //get('status?q=getBestBlockHash');
const getBlock = (blockHash: string) => {}; //get(`block/${blockHash}`);

const getTipTime = async () => {};

const broadcast = (transaction: string) => {};//get('tx/send', {rawtx: transaction});

const getInfo = async () => {};

const tokenBalance = (address: string) => mockData.tokenAddressBalance; //get(`tokens/balance?address=${address}`);
const tokenTransactions = (address: string) => mockData.tokenAddressTransactions; //get(`tokens/transactions?address=${address}`);
const tokenList = (cctxid?: string | string[]) => mockData.tokens; //cctxid ? get('tokens', {cctxid}) : get('tokens');
const tokenListAll = () => mockData.tokens; //get('tokens?pageNum=all');
const tokenOrderbook = (address?: string) => mockData.orderbook; //address ? get(`tokens/orderbook?address=${address}`) : get('tokens/orderbook');
// tx create API
const addCCInputs = (tokenid: string, pubkey: string, amount: number) => {}; //get(`tokens/addccinputs?pubkey=${pubkey}&tokenid=${tokenid}&amount=${amount}`);
const createCCTx = (amount: number | string, pubkey: string) => {}; //get(`tokens/createtx?pubkey=${pubkey}&amount=${amount}`);
const tokenUtxos = (address: string, tokenid: string, raw = false) => {}; //get(`tokens/utxo?address=${address}&cctxid=${tokenid}&raw=${raw}`)
const tokenTransactionsMany = (txid1: string, txid2: string) => {}; //get(`tokens/transactionsmany?txid1=${txid1}&txid2=${txid2}`);
const raddressToCIndexKeys = (address: string) => {}; //get(`tokens/convertAddress?address=${address}`);

const blockchain = {
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