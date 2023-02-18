import React, {useState} from 'react';
import Modal from './Modal';
import TokensLib from './cclib-import';
import Blockchain from './blockchain';
import {chains} from './constants';
import {getMaxSpendNormalUtxos} from './math';
import writeLog from './log';
import {CancelBidTokenModalProps} from './types';

const CancelBidTokenModal: React.FC<CancelBidTokenModalProps> = props => {
  const initialState: any = {
    isClosed: true,
    success: null,
    txid: null,
    error: null,
  };
  const [state, setState] = useState(initialState);

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

  const cancelBuyTokenOrder = async () => {
    const {chain, address, order} = props;
    
    try {
      let inputsData, rawtx;
      writeLog('cancelBidTokenOrder');
      writeLog(TokensLib.V2Assets);

      inputsData = {
        transactionsMany: await Blockchain.tokenTransactionsMany(order.tokenid, order.txid),
        normalUtxos: await Blockchain.createCCTx(10000, address.pubkey),
      };

      writeLog('cancelBidTokenOrder inputs data', inputsData);
      writeLog('send tx modal inputsData', JSON.stringify(inputsData));
      writeLog(state);
      
      try {
        rawtx = await TokensLib.V2Assets.buildTokenv2cancelbid(
          order.tokenid,
          order.txid,
          props.wif,
          inputsData,
        );
      } catch (e) {
        writeLog(e);
        setState((prevState: any) => ({
          ...prevState,
          success: null,
          txid: null,
          error: e.message,
        }));
      }
  
      writeLog('cancelBidTokenOrder token rawtx', rawtx);
  
      if (rawtx && rawtx.substr(0, 2) === '04') {
        const {txid} = await Blockchain.broadcast(rawtx);
  
        if (!txid || txid.length !== 64) {
          setState((prevState: any) => ({
            ...prevState,
            success: null,
            txid: null,
            error: 'Unable to broadcast transaction!',
          }));
        } else {
          setState((prevState: any) => ({
            ...prevState,
            success: `${chains[chain].explorerUrl}/${order.tokenid}/transactions/${txid}/${chain}`,
            txid,
            error: null,
            price: '',
            token: null,
            amount: '',
            tokenDropdownOpen: false,
          }));
          setTimeout(() => {
            props.syncData();
          }, 100);
        }
      } else {
        setState((prevState: any) => ({
          ...prevState,
          success: null,
          txid: null,
          error: 'Unable to build transaction!',
        }));
      }
    } catch (e) {
      setState((prevState: any) => ({
        ...prevState,
        success: null,
        txid: null,
        error: e.message,
      }));
    }
  }

  const getTokenData = (tokenid: string) => {
    const tokenInfo = props.tokenList.filter((tokenInfo: any) => tokenInfo.tokenid === tokenid)[0];
    return tokenInfo;
  }

  const render = () => {
    const {order} = props;
    const tokenInfo = getTokenData(order.tokenid);
    const maxNormalSpendValue = getMaxSpendNormalUtxos(props.normalUtxos);

    return (
      <React.Fragment>
        <div
          className={`${maxNormalSpendValue === 0 ? ' disabled' : ''}`}
          onClick={() => open()}>
          {props.children}
        </div>
        <Modal
          show={state.isClosed === false}
          handleClose={() => close()}
          isCloseable={true}
          className="Modal-send-token">
          <div className="create-token-form">
            <h4>Cancel Buy token order</h4>
            <div className="input-form">
              <input
                type="text"
                name="token"
                value={`Token: ${tokenInfo.name}`}
                disabled
                className="form-input" / >
              <input
                type="text"
                name="token"
                value={`Order size: ${order.totalrequired}`}
                disabled
                className="form-input" / >
              <input
                type="text"
                name="token"
                value={`Price: ${order.price}`}
                disabled
                className="form-input" / >
              <input
                type="text"
                name="token"
                value={`Total: ${(order.totalrequired || 0) * order.price}`}
                disabled
                className="form-input" / >
              <button
                type="button"
                onClick={cancelBuyTokenOrder}
                disabled={maxNormalSpendValue === 0}
                className="form-input">Cancel</button>
              {state.success &&
                <div className="success">
                  Token buy order cancelled!
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

export default CancelBidTokenModal;