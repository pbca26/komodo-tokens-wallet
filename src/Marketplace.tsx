import React, {useState, useEffect} from 'react';
import Blockchain from './blockchainWrapper';
import {secondsToString} from './time';
import {sortTransactions} from './sort';
import Jdenticon from './Jdenticon';
import SellTokenModal from './SellTokenModal';
import BuyTokenModal from './BuyTokenModal';
import TransactionDetailsModal from './TransactionDetailsModal';
import FillBidTokenModal from './FillBidTokenModal';
import FillAskTokenModal from './FillAskTokenModal';
import CancelAskTokenModal from './CancelAskTokenModal';
import CancelBidTokenModal from './CancelBidTokenModal';
import OrderFiltersModal from './OrderFiltersModal';
import Logo from './Logo';
import {chains} from './constants';
import writeLog from './log';
import {getMaxSpendNormalUtxos} from './math';
import {MarketplaceProps} from './types';

const SYNC_INTERVAL = 30 * 1000;
let syncTimeoutRef: ReturnType<typeof setTimeout>;

const Marketplace: React.FC<MarketplaceProps> = props => {
  const initialState: any = {
    tokenList: [],
    tokenBalance: [],
    tokenTransactions: [],
    normalUtxos: [],
    activeToken: null,
    activeOrderIndex: null,
    tokenOrders: [],
    pristine: true,
    filtersType: 'all',
    filtersDirection: 'all',
    tokenInfoShowNftData: false,
  };
  const [state, setState] = useState(initialState);

  const tokenInfoShowNftData = () => {
    setState((prevState: any) => ({
      ...prevState,
      tokenInfoShowNftData: !tokenInfoShowNftData
    }));
  }

  const setFilter = (name: string, value: string) => {
    setState((prevState: any) => ({
      ...prevState,
      [name]: value
    }));
  }

  const getTokenData = (tokenid: string) => {
    const tokenInfo = state.tokenList.filter((tokenInfo: any) => tokenInfo.tokenid === tokenid)[0];
    return tokenInfo;
  }

  const logout = () => {
    clearInterval(syncTimeoutRef);
    syncTimeoutRef = null;
    Blockchain[props.isDemo ? 'mock' : 'default'].setExplorerUrl();
    setState(initialState);
    props.resetApp();
  }

  const setActiveToken = (activeToken: string, activeOrderIndex: number) => {
    setState((prevState: any) => ({
      ...prevState,
      activeToken: state.activeToken === activeToken ? null : activeToken,
      activeOrderIndex: state.activeToken === activeToken ? null : activeOrderIndex,
    }));
  }

  const syncData = async () => {    
    let cctxids = [];

    const {address, chain} = props;
    const tokenBalance = await Blockchain[props.isDemo ? 'mock' : 'default'].tokenBalance(chains[chain].isRaddress ? address.normal : address.cc);
    const tokenTransactions = await Blockchain[props.isDemo ? 'mock' : 'default'].tokenTransactions(chains[chain].isRaddress ? address.normal : address.cc);
    const normalUtxos = await Blockchain[props.isDemo ? 'mock' : 'default'].getNormalUtxos(address.normal);
    const tokenOrders = await Blockchain[props.isDemo ? 'mock' : 'default'].tokenOrderbook(/*chains[chain].explorerApiVersion && chains[chain].explorerApiVersion === 2 ? address.cc : null*/);
    
    for (var i = 0; i < tokenBalance.balance.length; i++) {
      if (cctxids.indexOf(tokenBalance.balance[i].tokenId) === -1) cctxids.push(tokenBalance.balance[i].tokenId);
    }
    for (var i = 0; i < tokenTransactions.txs.length; i++) {
      if (cctxids.indexOf(tokenTransactions.txs[i].tokenId) === -1) cctxids.push(tokenTransactions.txs[i].tokenId);
    }
    for (var i = 0; i < tokenOrders.orderbook.length; i++) {
      if (cctxids.indexOf(tokenOrders.orderbook[i].tokenid) === -1) cctxids.push(tokenOrders.orderbook[i].tokenid);
    }
    const tokenList = await Blockchain[props.isDemo ? 'mock' : 'default'].tokenListAll();/*chains[chain].explorerApiVersion && chains[chain].explorerApiVersion === 2 ? await Blockchain.tokenList(cctxids) : await Blockchain.tokenList();*/

    setState((prevState: any) => ({
      ...prevState,
      tokenList: tokenList.tokens,
      tokenBalance: tokenBalance.balance,
      tokenTransactions: tokenTransactions.txs,
      tokenOrders: tokenOrders.orderbook,
      normalUtxos,
      pristine: false,
    }));
  }

  useEffect(() => {
    writeLog('marketplace state', state);
  });

  useEffect(() => {
    syncTimeoutRef = setInterval(() => {
      syncData();
    }, SYNC_INTERVAL);

    syncData();

    return () => {
      clearInterval(syncTimeoutRef);
    };
  }, []);

  const getNormalBalance = () => {
    if (state.normalUtxos.length) {
      return {
        value: state.normalUtxos.length === 1 ? Number(state.normalUtxos[0].amount || 0) : Number(state.normalUtxos.reduce((accumulator: number, item: any) => Number(accumulator) + Number(item.amount), 0).toFixed(8)),
        satoshi: state.normalUtxos.length === 1 ? state.normalUtxos[0].satoshi || 0 : state.normalUtxos.reduce((accumulator: number, item: any) => Number(accumulator) + Number(item.satoshi), 0),
      };
    } else {
      return {
        value: 0,
        satoshi: 0,
      };
    }
  }

  const renderOrders = () => {
    const {address, chain} = props;
    let orders = state.tokenOrders;
    let items = [];

    if (state.filtersType === 'my') {
      orders = orders.filter((x: any) => x.origtokenaddress === address.cc);
    }

    if (state.filtersDirection === 'sell') {
      orders = orders.filter((x: any) => x.funcid === 's' || x.funcid === 'S');
    } else if (state.filtersDirection === 'buy') {
      orders = orders.filter((x: any) => x.funcid === 'b' || x.funcid === 'B');
    }

    for (let i = 0; i < orders.length; i++) {
      const tokenInfo = getTokenData(orders[i].tokenid);

      items.push(
        <div
          key={`token-tile-${orders[i].tokenid}`}
          className={`token-tile${orders[i].tokenid === state.activeToken ? ' active' : ''}`}
          onClick={() => setActiveToken(orders[i].tokenid, i)}
          data-testid={`token-order-item-${orders[i].tokenid}`}>
          {orders[i].origtokenaddress === address.cc &&
           (orders[i].funcid === 's' || orders[i].funcid === 'S') &&
            <CancelAskTokenModal
              tokenList={state.tokenList}
              tokenBalance={state.tokenBalance}
              normalUtxos={state.normalUtxos}
              order={orders[i]}
              setActiveToken={setActiveToken}
              syncData={syncData}
              {...props}>
              <i
                className="fa fa-trash order-cancel-trigger"
                data-testid={`token-order-cancel-${orders[i].tokenid}`}></i>
            </CancelAskTokenModal>
          }
          {orders[i].origtokenaddress === address.cc &&
           (orders[i].funcid === 'b' || orders[i].funcid === 'B') &&
            <CancelBidTokenModal
              tokenList={state.tokenList}
              tokenBalance={state.tokenBalance}
              normalUtxos={state.normalUtxos}
              order={orders[i]}
              setActiveToken={setActiveToken}
              syncData={syncData}
              {...props}>
              <i
                className="fa fa-trash order-cancel-trigger"
                data-testid={`token-order-cancel-${orders[i].tokenid}`}></i>
            </CancelBidTokenModal>
          }
          <div className="jdenticon">
            <Jdenticon
              size="48"
              value={tokenInfo.name} />
          </div>
          <strong>{tokenInfo && tokenInfo.name ? tokenInfo.name : orders[i].tokenid}</strong>
          <br />
          <span>
            {(orders[i].funcid === 's' || orders[i].funcid === 'S') &&
              <React.Fragment>
                <strong>Sell price:</strong> {orders[i].price} {chain}
                <div style={{'paddingTop': '10px'}}>
                  <strong>Tokens:</strong> {orders[i].askamount}
                </div>
              </React.Fragment>
            }
            {(orders[i].funcid === 'b' || orders[i].funcid === 'B') &&
              <React.Fragment>
                <strong>Buy price:</strong> {orders[i].price} {chain}
                <div style={{'paddingTop': '10px'}}>
                  <strong>Tokens:</strong> {orders[i].totalrequired}
                </div>
              </React.Fragment>
            }
          </span>
        </div>
      );
    }

    return (
      <React.Fragment>
        <h4>Orderbook</h4>
        <OrderFiltersModal
          {...state}
          setFilter={setFilter}>
          <a className="filters-trigger">Filters</a>
        </OrderFiltersModal>
        {state.tokenBalance.length > 0 &&
         state.normalUtxos.length > 0 &&
          <React.Fragment>
            <SellTokenModal
              tokenList={state.tokenList}
              tokenBalance={state.tokenBalance}
              normalUtxos={state.normalUtxos}
              syncData={syncData}
              {...props} />
            <BuyTokenModal
              tokenList={state.tokenList}
              tokenBalance={state.tokenBalance}
              normalUtxos={state.normalUtxos}
              syncData={syncData}
              {...props} />
          </React.Fragment>
        }
        <div className="token-balance-block">
          {items.length ? items : 'No orders'}
        </div>
      </React.Fragment>
    );
  }

  const renderTransactions = () => {
    const {address, chain} = props;
    let transactions = state.tokenTransactions;
    let items = [];

    let transactionsMerge = [];
    for (let i = 0; i < transactions.length; i++) {
      for (let j = 0; j < transactions[i].txs.length; j++) {
        if (!state.activeToken ||
            (state.activeToken && state.activeToken === transactions[i].tokenId)) {
          if (transactions[i].txs[j].height === -1 ||
              transactions[i].txs[j].height === 0) {
            transactions[i].txs[j].height = 0;
            transactions[i].txs[j].time = Math.floor(Date.now() / 1000);
          }

          if (transactions[i].txs[j].type === 'ask' ||
              transactions[i].txs[j].type === 'bid' ||
              transactions[i].txs[j].type.indexOf('fill') > -1 ||
              transactions[i].txs[j].type.indexOf('cancel') > -1) {
            transactionsMerge.push({
              ...transactions[i].txs[j],
              tokenid: transactions[i].tokenId,
              tokenName: getTokenData(transactions[i].tokenId).name,
            });
          }
        }
      }
    }
    transactions = transactionsMerge;

    transactions = sortTransactions(transactions);

    for (let i = 0; i < transactions.length; i++) {
      const tokenInfo = getTokenData(transactions[i].tokenid);
      let directionClass = transactions[i].to === address.cc && transactions[i].to !== transactions[i].from ? 'arrow-alt-circle-down color-green' : 'arrow-alt-circle-up';

      if (transactions[i].to === transactions[i].from) directionClass = 'circle';

      if (transactions[i].type === 'coinbase') directionClass = 'gavel';

      items.push(
        <TransactionDetailsModal
          transaction={transactions[i]}
          directionClass={directionClass}
          tokenInfo={tokenInfo}
          chainInfo={chains[chain]}
          chain={props.chain}
          key={`token-tile-${transactions[i].txid}-wrapper`}>
          <div
            key={`token-tile-${transactions[i].txid}`}
            className="token-transaction-item"
            data-testid={`token-transaction-${transactions[i].txid}`}>
            <div className="transaction-left">
              <i className={`fa fa-${directionClass}`}></i>
              <div className="jdenticon">
                <Jdenticon
                  size="48"
                  value={tokenInfo.name} />
              </div>
              <div className="token-name">
                {tokenInfo.name}
                {transactions[i].height < 1 &&
                  <i
                    className="fa fa-spinner transaction-unconfirmed"
                    title="Transaction is pending confirmation"></i>
                }
              </div>
              <div className="transaction-time">
                {secondsToString(transactions[i].time)}
              </div>
            </div>
            <div className="transaction-right">
              <div className="transaction-value">{transactions[i].value} {tokenInfo.name}</div>
              <div className="transaction-address">{transactions[i].to}</div>
              <i className="fa fa-chevron-right"></i>
            </div>
          </div>
        </TransactionDetailsModal>
      );
    }

    return (
      <React.Fragment>
        <h4>Last trades</h4>
        <div className="token-transactions-block">
          {items.length ? items : 'No trades history'}
        </div>
      </React.Fragment>
    );
  }

  const renderOrderInfo = () => {
    if (state.activeToken) {
      const tokenInfo = getTokenData(state.activeToken);
      const orderInfo = state.tokenOrders[state.activeOrderIndex];
      const {chain} = props;

      const checkTypeOfArbitraryData = (data: any) => {
        try {
          JSON.parse(data);
          console.warn('JSON.parse(data)', JSON.parse(data));
          return true;
        } catch (e) {
          console.warn(e)
        }
      };

      const renderTokenNFTData = () => {
        if (typeof tokenInfo.data.decoded === 'object') {
          const tokenNFTData = tokenInfo.data.decoded;
          let items = [];

          for (let i = 0; i < Object.keys(tokenNFTData).length; i++) {
            const tokenNFTDataKey = Object.keys(tokenNFTData)[i];
            const tokenNFTDataValue = tokenNFTData[tokenNFTDataKey];

            items.push(
              <tr>
                <td className="ucfirst">
                  <strong>{tokenNFTDataKey}</strong>
                </td>
                <td>
                  {tokenNFTDataKey === 'url' &&
                    <React.Fragment>
                      <a
                        target="_blank"
                        href={tokenNFTDataValue}>
                        {tokenNFTDataValue}
                      </a>
                    </React.Fragment>
                  }
                  {tokenNFTDataKey !== 'url' &&
                    <React.Fragment>{tokenNFTDataKey === 'arbitrary' && checkTypeOfArbitraryData(tokenNFTDataValue) ? <pre className="pre-nostyle">{JSON.stringify(JSON.parse(tokenNFTDataValue), null, 2)}</pre> : tokenNFTDataValue}</React.Fragment>
                  }
                </td>
              </tr>
            );
          }

          return (
            <table className="table">
              <tbody>
                {items}
              </tbody>
            </table>
          );
        } else {
          return tokenInfo.data.decoded;
        }
      };

      return (
        <React.Fragment>
          <h4>
            {tokenInfo.data && tokenInfo.data.decoded &&
              <span
                className="token-info-trigger"
                onClick={tokenInfoShowNftData}>
                Order info
                <i className={`fa fa-chevron-${state.tokenInfoShowNftData ? 'up' : 'down'}`}></i>
                {(orderInfo.funcid === 'b' || orderInfo.funcid === 'B') &&
                  <FillBidTokenModal
                    tokenList={state.tokenList}
                    tokenBalance={state.tokenBalance}
                    normalUtxos={state.normalUtxos}
                    order={orderInfo}
                    setActiveToken={setActiveToken}
                    syncData={syncData}
                    {...props} />
                }
                {(orderInfo.funcid === 's' || orderInfo.funcid === 'S') &&
                  <FillAskTokenModal
                    tokenList={state.tokenList}
                    tokenBalance={state.tokenBalance}
                    normalUtxos={state.normalUtxos}
                    order={orderInfo}
                    setActiveToken={setActiveToken}
                    syncData={syncData}
                    {...props} />
                }
              </span>
            }
            {!tokenInfo.data &&
              <React.Fragment>
                Order info
                {(orderInfo.funcid === 'b' || orderInfo.funcid === 'B') &&
                  <FillBidTokenModal
                    tokenList={state.tokenList}
                    tokenBalance={state.tokenBalance}
                    normalUtxos={state.normalUtxos}
                    order={orderInfo}
                    setActiveToken={setActiveToken}
                    syncData={syncData}
                    {...props} />
                }
                {(orderInfo.funcid === 's' || orderInfo.funcid === 'S') &&
                  <FillAskTokenModal
                    tokenList={state.tokenList}
                    tokenBalance={state.tokenBalance}
                    normalUtxos={state.normalUtxos}
                    order={orderInfo}
                    setActiveToken={setActiveToken}
                    syncData={syncData}
                    {...props} />
                }
              </React.Fragment>
            }
          </h4>
          <div className="token-info-block">
            <table className="table">
              <tbody>
                <tr>
                  <td>
                    <strong>Direction</strong>
                  </td>
                  <td>{orderInfo.funcid === 's' || orderInfo.funcid === 'S' ? 'Sell' : 'Buy'}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Owner address</strong>
                  </td>
                  <td>{orderInfo.origtokenaddress || ''}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Price per token</strong>
                  </td>
                  <td>{orderInfo.price || ''} {chain}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Order size</strong>
                  </td>
                  <td>{orderInfo.totalrequired || ''} {orderInfo.funcid !== 's' && orderInfo.funcid !== 'S' ? tokenInfo.name : chain}</td>
                </tr>
                <tr>
                  <td
                    className="text-left no-border">
                    <strong>Order transaction ID</strong>
                  </td>
                  <td className="token-info-link">
                    <a
                      target="_blank"
                      href={`${chains[chain].explorerUrl}/${tokenInfo.tokenid}/transactions/${orderInfo.txid}/${chain}`}>
                      {orderInfo.txid} <i className="fa fa-external-link-alt"></i>
                    </a>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Token name</strong>
                  </td>
                  <td className="token-info-link">
                    <a
                      target="_blank"
                      href={`${chains[chain].explorerUrl}/${tokenInfo.tokenid}/transactions/${chain}`}>
                      {tokenInfo.name} <i className="fa fa-external-link-alt"></i>
                    </a>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Description</strong>
                  </td>
                  <td>
                    {tokenInfo.description}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Supply</strong>
                  </td>
                  <td>
                    {tokenInfo.supply}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Owner</strong>
                  </td>
                  <td>
                    {tokenInfo.owner}
                  </td>
                </tr>
                {tokenInfo.data &&
                 tokenInfo.data.decoded &&
                 state.tokenInfoShowNftData &&
                  <tr>
                    <td>
                      <strong>Data</strong>
                    </td>
                    <td>
                      {renderTokenNFTData()}
                    </td>
                  </tr>
                }
                {tokenInfo.data &&
                 tokenInfo.data.decoded &&
                 state.tokenInfoShowNftData &&
                  <tr>
                    <td>
                      <strong>Raw Data</strong>
                    </td>
                    <td>
                      <pre>{JSON.stringify(tokenInfo.data.decoded, null, 2) }</pre>
                    </td>
                  </tr>
                }
                {tokenInfo.data &&
                 tokenInfo.data.decoded &&
                 !state.tokenInfoShowNftData &&
                 <tr>
                  <td colSpan={2}>
                    ...
                  </td>
                </tr>
                }
              </tbody>
            </table>
          </div>
        </React.Fragment>
      );
    }
  }

  const render = () => {
    const maxSpendNormalUtxos = getMaxSpendNormalUtxos(state.normalUtxos, 20000);
    const normalBalance = getNormalBalance().value;
    const {chain, address} = props;

    return(
      <div className="main dashboard marketplace">
        <i
          className="fa fa-lock logout-btn"
          onClick={logout}></i>
        <Logo />
        <div className="content">
          <h4>Marketplace | <a onClick={(e) => props.setActiveView(e, true)}>Wallet</a></h4>

          <div className="address-block">
            {chains[props.chain].isRaddress &&
              <div>
                <strong>My address:</strong> {address.normal}
              </div>
            }
            {!chains[props.chain].isRaddress &&
              <>
                <div>
                  <strong>My Normal address:</strong> {address.normal}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`${chains[chain].faucetURL}${address.normal}`}><i className="fa fa-faucet faucet-btn"></i></a>
                </div>
                <div style={{'paddingTop': '20px'}}>
                  <strong>My CC address:</strong> {address.cc}
                </div>
                <div style={{'paddingTop': '20px'}}>
                  <strong>My pubkey:</strong> {address.pubkey}
                </div>
              </>
            }
          </div>

          <div className="tokens-block">
            {state.normalUtxos.length > 0  &&
              <React.Fragment>
                <strong>{!chains[props.chain].isRaddress ? 'Normal' : 'Address'} balance:</strong> <span>{normalBalance}</span> <span>{chain}</span>
              </React.Fragment>
            }
            {renderOrders()}
            {maxSpendNormalUtxos === 0 &&
             !state.pristine &&
              <div>
                <strong>Please make a deposit (min of 0.00002 {chain}) to your normal address in order to create or send tokens</strong>
              </div>
            }
            {renderOrderInfo()}
            {renderTransactions()}
          </div>
        </div>
      </div>
    );
  }

  return render();
}

export default Marketplace;