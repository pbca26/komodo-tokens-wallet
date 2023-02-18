if (typeof window === 'undefined') process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

const getRandomIntInclusive = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min + 1)) + min; // the maximum is inclusive and the minimum is inclusive
};

class Escrow {
  constructor(config, tokenslib, blockchain, utxoLib, logger) {
    this.config = config;
    this.tokenslib = tokenslib;
    this.blockchain = blockchain;
    this.utxoLib = utxoLib;
    this.logger = logger;
  }

  run() {
    (async() => {
      const seed = this.config.seed;
      let req, myTokensList = [], inputTokenTxs;
    
      const receiveAddress = this.tokenslib.keyToCCAddress(this.tokenslib.keyToWif(seed), 'wif', true);
    
      this.logger('receiveAddress', receiveAddress);
    
      this.blockchain.setExplorerUrl(this.config.explorerApiUrl);
    
      this.logger('get a list of tokens in stock');
      req = await this.blockchain.tokenListAll();
    
      for (let t = 0; t < req.tokens.length; t++) {
        if (req.tokens[t].ownerAddress === receiveAddress.cc &&
            req.tokens[t].name.indexOf(this.config.tokenOutputNameMask) > -1) {
          //this.logger(JSON.stringify(req.tokens[t], null, 2));
          myTokensList.push(req.tokens[t].tokenid);
        }
      }

      this.logger('total tokens available in stock', myTokensList.length);
    
      //this.logger('myTokensList', JSON.stringify(myTokensList, null, 2));
      
      const run = async() => {
        this.logger('start deposit address history check');
        let inAddrTokenCount = {}, outAddrSentTokenCount = {}, allTxIds = [];
        req = await this.blockchain.tokenTransactions(receiveAddress.cc);
        let reqCopy = JSON.parse(JSON.stringify(req)); 
    
        for (let r = 0; r < req.txs.length; r++) {
          for (let rr = 0; rr < req.txs[r].txs.length; rr++) {
            if (allTxIds.indexOf(req.txs[r].txs[rr].txid) > -1) {
              //this.logger('dupe txid' + req.txs[r].txs[rr].txid);
              reqCopy.txs[r].txs.splice(rr, 1);
            } else {
              allTxIds.push(req.txs[r].txs[rr].txid);
            }
          }
        }
    
        req = reqCopy;
        
        //this.logger(JSON.stringify(req, null, 2));
        this.logger('check deposits for confs (min 1 conf)');
      
        inputTokenTxs = req.txs.filter(x => x.tokenId === this.config.tokenId)[0];
        let inputTokenTxsChecked = [];
      
        for (let i = 0; i < inputTokenTxs.txs.length; i++) {
          if (Number(inputTokenTxs.txs[i].height) < 1) {
            const confTx = await this.blockchain.getTransaction(inputTokenTxs.txs[i].txid);
            if (confTx.confirmations) {
              inputTokenTxsChecked.push(inputTokenTxs.txs[i]);
            }
          } else {
            inputTokenTxsChecked.push(inputTokenTxs.txs[i]);
          }
        }
    
        for (let i = 0; i < inputTokenTxsChecked.length; i++) {
          if (!inAddrTokenCount[inputTokenTxsChecked[i].from]) inAddrTokenCount[inputTokenTxsChecked[i].from] = 0;
          if (inAddrTokenCount.hasOwnProperty(inputTokenTxsChecked[i].from)) inAddrTokenCount[inputTokenTxsChecked[i].from] += inputTokenTxsChecked[i].value;
        }
      
        this.logger('deposits', JSON.stringify(inAddrTokenCount, null, 2));
      
        for (let addr in inAddrTokenCount) {
          if (!outAddrSentTokenCount[addr]) outAddrSentTokenCount[addr] = 0;
    
          for (let a = 0; a < req.txs.length; a++) {
            //this.logger(req.txs[a].tokenId)
            for (let b = 0; b < req.txs[a].txs.length; b++) {
              //this.logger('tx', req.txs[a].txs[b]);
      
              if (req.txs[a].txs[b].to === addr &&
                  req.txs[a].txs[b].tokenId !== this.config.tokenId) {
                //this.logger('tx', req.txs[a].txs[b]);
                if (myTokensList.indexOf(req.txs[a].txs[b].tokenid) > -1) {
                  outAddrSentTokenCount[addr]++;
                }
              }
            }
          }
        }
        
        this.logger('check if any of deposits haven\'t received tokens back');
        for (let addr in inAddrTokenCount) {
          this.logger('address', addr, 'received tokens', outAddrSentTokenCount[addr], 'of', inAddrTokenCount[addr]);
      
          for (let sendCounter = inAddrTokenCount[addr] - outAddrSentTokenCount[addr]; sendCounter > 0; sendCounter--) {
            this.logger('get available token balances');
            let myTokenBalances = await this.blockchain.tokenBalance(receiveAddress.cc);
            myTokenBalances = myTokenBalances.balance.filter(x => x.tokenId !== this.config.tokenId);
            //this.logger(JSON.stringify(myTokenBalances, null, 2));
        
            const randomTokenToSend = myTokenBalances[getRandomIntInclusive(0, myTokenBalances.length - 1)];
            this.logger('random set for address', addr, 0 , '-', myTokenBalances.length - 1)
            this.logger('random token to send to address', addr, randomTokenToSend.tokenId);
        
            const inputsData = {
              ccUtxos: await this.utxoLib.utxoSelectCC(receiveAddress.cc, randomTokenToSend.tokenId, true),
              normalUtxos: await this.utxoLib.utxoSelectNormal(receiveAddress.normal, 10000, true),
            };
        
            //this.logger('send tx modal inputsData', inputsData);
        
            const tokensReceived = inputTokenTxsChecked.filter(x => x.from === addr);
      
            const txData = await this.blockchain.getTransaction(tokensReceived[0].txid);
            let outPK;
        
            //this.logger('txData', JSON.stringify(txData, null, 2));
        
            for (let txd = 0; txd < txData.vin.length; txd++) {
              if (txData.vin[txd].addr[0] === 'R' &&
                  txData.vin[txd].scriptSig &&
                  txData.vin[txd].scriptSig.asm.indexOf('[ALL] ') > -1) {
                outPK = txData.vin[txd].scriptSig.asm.substr(txData.vin[txd].scriptSig.asm.indexOf('[ALL] ') + 6, 66);
                this.logger('send token to pubkey', outPK);
                break;
              }
            }
            
            const rawtx = await this.tokenslib.transferTokenTx(
              randomTokenToSend.tokenId, outPK, 1, this.tokenslib.keyToWif(seed), inputsData
            );
                    
            const {txid} = await this.blockchain.broadcast(rawtx);
            
            if (!txid || txid.length !== 64) {
              this.logger('error unable to broadcast tx', rawtx);
            } else {
              this.logger(`token ${randomTokenToSend.tokenId} is sent to ${addr}, txid ${txid}`);
            }
          }
        }

        this.logger('endrun');
      };
      run();
    })();
  }
}

module.exports = Escrow;