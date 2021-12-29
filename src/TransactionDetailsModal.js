import React from 'react';
import Modal from './Modal';
import {secondsToString} from './time';
import './TransactionDetailsModal.scss';

class TransactionDetailsModal extends React.Component {
  state = {
    isClosed: true
  };

  close() {
    this.setState({
      isClosed: true
    });
  }

  open() {
    this.setState({
      isClosed: false
    });
  }

  render() {
    const {transaction, chainInfo, tokenInfo, chain, directionClass} = this.props;
    let direction = '';

    if (directionClass === 'gavel') {
      direction = 'token created';
    } else if (directionClass === 'circle') {
      direction = 'sent to self';
    } else if (directionClass.indexOf('circle-down') > -1) {
      direction = 'received';
    } else if (directionClass.indexOf('circle-up') > -1) {
      direction = 'sent';
    }
    
    // assets
    if (transaction.type === 'fill') {
      direction = 'trade completed';
    } else if (transaction.type === 'ask') {
      direction = 'sell order placed';
    } else if (transaction.type === 'bid') {
      direction = 'buy order placed';
    } else if (transaction.type === 'cancel') {
      direction = 'order cancelled';
    }
    
    //console.warn(this.props);

    return (
      <React.Fragment>
        <div onClick={() => this.open()}>
          {this.props.children}
        </div>
        <Modal
          title="Transaction Details"
          show={this.state.isClosed === false}
          handleClose={() => this.close()}
          isCloseable={true}
          className="Modal-transaction-details">
          <React.Fragment>
            <table className="table">
              <tbody>
                <tr>
                  <td>
                    <strong>Token</strong>
                  </td>
                  <td className="token-info-link">
                    <a
                      target="_blank"
                      href={`${chainInfo.explorerUrl}/${tokenInfo.tokenid}/transactions/${chain}`}>
                      {tokenInfo.name} <i className="fa fa-external-link-alt"></i>
                    </a>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Status</strong>
                  </td>
                  <td>{Number(transaction.height) === -1 || Number(transaction.height) === 0 ? 'pending' : direction}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Date</strong>
                  </td>
                  <td>{Number(transaction.height) === -1 || Number(transaction.height) === 0 ? '' : secondsToString(transaction.time)}</td>
                </tr>
                {/*<tr>
                  <td>
                    <strong>Confirmations</strong>
                  </td>
                  <td>{transaction.confirmations}</td>
                </tr>*/}
                <tr>
                  <td>
                    <strong>Height</strong>
                  </td>
                  <td>{transaction.height || ''}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Value</strong>
                  </td>
                  <td>{transaction.value || ''}</td>
                </tr>
                <tr>
                  <td
                    colSpan="2"
                    className="text-left no-border">
                    <strong>Transaction ID</strong>
                  </td>
                </tr>
                <tr>
                  <td
                    colSpan="2"
                    className="text-left">
                    {transaction.txid}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="modal-action-block center">
              <a
                target="_blank"
                href={`${chainInfo.explorerUrl}/${tokenInfo.tokenid}/transactions/${transaction.txid}/${chain}`}>
                <button className="button">
                  Open in explorer <i className="fa fa-external-link-alt"></i>
                </button>
              </a>
            </div>
          </React.Fragment>
        </Modal>
      </React.Fragment>
    );
  }
}

export default TransactionDetailsModal;