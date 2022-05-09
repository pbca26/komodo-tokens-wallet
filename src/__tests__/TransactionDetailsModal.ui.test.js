import React from 'react';
import renderer from 'react-test-renderer';
import {render, fireEvent, screen} from '@testing-library/react';
import TransactionDetailsModal from '../TransactionDetailsModal';
import '../__mocks__/ccimport';
import blockchainMockData from '../__mocks__/blockchain.json';
import {chains} from '../constants';

test('Transaction details component render check', () => {
  const mProps = {
    directionClass: 'gavel',
    transaction: blockchainMockData.transactions.txs[0].txs[0],
    chainInfo: chains.TKLTEST,
    tokenInfo: blockchainMockData.tokens.tokens.filter(x => x.tokenid === blockchainMockData.transactions.txs[0].tokenId)[0],
    chain: 'TKLTEST',
  };

  //console.warn('mProps', mProps)

  const component = renderer.create(
    <TransactionDetailsModal {...mProps} />,
  );
  
  let treeJSON = component.toJSON();
  expect(treeJSON).toMatchSnapshot();

  let tree = component.toTree();

  //console.log(tree.instance.state)
  const {getByText, getAllByRole} = render(<TransactionDetailsModal {...mProps} />);

  // check if all labels/titles/form elements are present
  // token name
  expect(getByText('Token')).toBeDefined();
  expect(getByText('Test')).toBeDefined();
  expect(getAllByRole('link', {href: 'http://explorer.komodoplatform.com:20000/tokens/743b30659a947779f3a0d002bee4e1ab1fa5b03182beccd1a3ca0d55db99d015/transactions/TKLTEST'})).toBeDefined();
  // transaction status
  expect(getByText('Status')).toBeDefined();
  expect(getByText('token created')).toBeDefined();
  // transaction date
  expect(getByText('Date')).toBeDefined();
  expect(getByText('15 Oct 2021 16:36')).toBeDefined();
  // transaction height
  expect(getByText('Height')).toBeDefined();
  expect(getByText('81701')).toBeDefined();
  // transaction value (token supply)
  expect(getByText('Value')).toBeDefined();
  expect(getByText('10')).toBeDefined();
  // transaction ID
  expect(getByText('Transaction ID')).toBeDefined();
  expect(getByText('743b30659a947779f3a0d002bee4e1ab1fa5b03182beccd1a3ca0d55db99d015')).toBeDefined();
  // explorer link
  expect(getByText('Open in explorer')).toBeDefined();
  expect(getAllByRole('link', {href: 'http://explorer.komodoplatform.com:20000/tokens/743b30659a947779f3a0d002bee4e1ab1fa5b03182beccd1a3ca0d55db99d015/transactions/743b30659a947779f3a0d002bee4e1ab1fa5b03182beccd1a3ca0d55db99d015/TKLTEST'})).toBeDefined();
});