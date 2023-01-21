import React, {useState, useEffect} from 'react';
import Modal from './Modal';
import TokensLib from './cclib-import';
import Blockchain from './blockchain';
import {chains} from './constants';
import {utxoSelectCC, utxoSelectNormal} from './utxo-select';
import {toSats} from './math';
import {getMaxSpendNormalUtxos} from './math';
import writeLog from './log';
import devVars from './dev'

const FillBidTokenModal = props => {
  const initialState = {
    isClosed: true,
    amount: devVars && devVars.fill.amountBid || '',
    success: null,
    txid: null,
    error: null,
  };
  const [state, setState] = useState(initialState);

  const updateInput = e => {
    if (e.target.name === 'amount') {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    }

    setState(prevState => ({
      ...prevState,
      [e.target.name]: e.target.value,
      error: null,
      success: null,
      txid: null,
    }));
  }

  useEffect(() => {
    writeLog('fillbid token modal state', state);
  });

  const close = () => {
    setState({
      ...initialState,
      isClosed: true
    });
  }

  const open = () => {
    setState({
      ...initialState,
      isClosed: false
    });
  }

  const sellToken = async () => {
    const {chain, address, order} = props;
    
    if (Number(state.amount) > order.askamount ||
        Number(state.amount) < 1) {
      setState(prevState => ({
        ...prevState,
        success: null,
        txid: null,
        error: order.askamount === 1 ? 'Amount must be equal to 1' : 'Amount must be between 1 and ' + order.askamount,
      }));
    } else if (toSats(order.price * state.amount) > getMaxSpendNormalUtxos(props.normalUtxos)) {
      setState(prevState => ({
        ...prevState,
        success: null,
        txid: null,
        error: 'Not enough balance',
      }));
    } else {
      try {
        let inputsData, rawtx;
        writeLog('fillbidToken');
        writeLog(TokensLib.V2Assets);

        inputsData = {
          transactionsMany: await Blockchain.tokenTransactionsMany(order.tokenid, order.txid),
          ccUtxos: await Blockchain.addCCInputs(order.tokenid, address.pubkey, Number(state.amount)),
          normalUtxos: await Blockchain.createCCTx(toSats(order.price * state.amount) + 10000, address.pubkey),
        };

        writeLog('fillbidToken inputs data', inputsData);

        try {
          rawtx = await TokensLib.V2Assets.buildTokenv2fillbid(
            order.tokenid,
            order.txid,
            Number(state.amount),
            order.price,
            props.wif,
            inputsData,
          );
        } catch (e) {
          writeLog(e);
          setState(prevState => ({
            ...prevState,
            success: null,
            txid: null,
            error: e.message,
          }));
        }
    
        writeLog('fillbidToken token rawtx', rawtx);
    
        if (rawtx && rawtx.substr(0, 2) === '04') {
          const {txid} = await Blockchain.broadcast(rawtx);
    
          if (!txid || txid.length !== 64) {
            setState(prevState => ({
              ...prevState,
              success: null,
              txid: null,
              error: 'Unable to broadcast transaction!',
            }));
          } else {
            setState(prevState => ({
              ...prevState,
              success: `${chains[chain].explorerUrl}/${order.tokenid}/transactions/${txid}/${chain}`,
              txid,
              error: null,
              price: '',
              token: null,
              amount: '',
              tokenDropdownOpen: false,
            }));
            //props.setActiveToken();
            setTimeout(() => {
              props.syncData();
            }, 100);
          }
        } else {
          setState(prevState => ({
            ...prevState,
            success: null,
            txid: null,
            error: 'Unable to build transaction!',
          }));
        }
      } catch (e) {
        setState(prevState => ({
          ...prevState,
          success: null,
          txid: null,
          error: e.message,
        }));
      }
    }
  }

  const getTokenData = tokenid => {
    const tokenInfo = props.tokenList.filter(tokenInfo => tokenInfo.tokenid === tokenid)[0];
    return tokenInfo;
  }

  const render = () => {
    const {order} = props;
    const tokenInfo = getTokenData(order.tokenid);
    const maxNormalSpendValue = getMaxSpendNormalUtxos(props.normalUtxos);

    return (
      <React.Fragment>
        <div
          className={`fill-buy-order-trigger ${maxNormalSpendValue === 0 ? ' disabled' : ''}`}
          onClick={() => open()}>
          <i className="fa fa-dollar-sign"></i>
          Sell
        </div>
        <Modal
          show={state.isClosed === false}
          handleClose={() => close()}
          isCloseable={true}
          className="Modal-send-token">
          <div className="create-token-form">
            <h4>Sell token</h4>
            <p>Fill out the form below</p>
            <div className="input-form">
              <input
                type="text"
                name="token"
                value={`Token: ${tokenInfo.name}`}
                disabled
                className="form-input" />
              <input
                type="text"
                name="amount"
                placeholder="Amount (qty)"
                value={state.amount}
                onChange={updateInput}
                className="form-input" />
              <input
                type="text"
                name="token"
                value={`Price: ${order.price}`}
                disabled
                className="form-input" />
              <input
                type="text"
                name="token"
                value={`Total: ${(state.amount || 0) * order.price}`}
                disabled
                className="form-input" />
              <button
                type="button"
                onClick={sellToken}
                disabled={
                  !state.amount ||
                  maxNormalSpendValue === 0
                }
                className="form-input">Sell</button>
              {state.success &&
                <div className="success">
                  Token sell order filled!
                  <div className="txid-label">
                    <strong>Transaction ID:</strong> {state.txid}
                  </div>
                  <a
                    href={state.success}
                    target="_blank">Open on explorer</a>
                </div>
              }
              {state.error &&
                <div className="error">
                  <div>
                    <strong>Error!</strong>
                    <div>{state.error}</div>
                  </div>
                </div>
              }
            </div>
          </div>
        </Modal>
      </React.Fragment>
    );
  }

  return render();
}

export default FillBidTokenModal;