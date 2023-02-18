import React from 'react';
import renderer from 'react-test-renderer';
import {render, fireEvent, screen, waitFor} from '@testing-library/react';
import SendTokenModal from '../SendTokenModal';
import '../__mocks__/ccimport';
import blockchainMockData from '../__mocks__/blockchain.json';
import {chains} from '../constants';
import 'regenerator-runtime/runtime';

import mockFetch from '../__mocks__/fetch';
import blockchain from '../blockchain';

global.fetch = mockFetch;
blockchain.setExplorerUrl('');

// TODO: (1) test keying input data actually changes state
//       (2) erroneous input

test('SendTokenModal component render and token send event check', async () => {
  const mProps = {
    tokenList: blockchainMockData.tokens.tokens,
    tokenBalance: blockchainMockData.balance.balance,
    normalUtxos: blockchainMockData.utxo,
    wif: 'UtaKVKuNvDVYxqS8PhRESwKeRYHhzYYkEGgvwEJ9XvghuRVs1VNM',
    address: {
      normal: 'RRF6ocq94kLpaH6wPdZjTqQa9mAmT1GToc',
      cc: 'CaopajuemreFwEAfbywvFi8oFyrJPNkDs1',
      pubkey: '03256ba44eeb188404b94ae8ed64f1fe6ad89580375830845361e365598efa3ff3'
    },
    chain: 'TKLTEST',
  };

  //console.warn('mProps', mProps)

  const component = renderer.create(
    <SendTokenModal {...mProps} />,
  );
  
  let treeJSON = component.toJSON();
  expect(treeJSON).toMatchSnapshot();

  let tree = component.toTree();

  //console.log(tree.instance.state)
  const {getAllByText, getByText, getByRole, getAllByRole, getByPlaceholderText} = render(<SendTokenModal {...mProps} />);

  // check if all labels/titles/form elements are present
  expect(getAllByRole('button').length).toBe(3);
  
  // form name
  expect(getAllByText('Send')[0]).toBeDefined();
  // submit button
  expect(getAllByText('Send')[2]).toBeDefined();
  
  // form labels
  expect(getByText('Send token')).toBeDefined();
  expect(getByText('Fill out the form below')).toBeDefined();

  // token selector
  expect(getAllByText('NFTJS')).toBeDefined();
  // token amount field
  expect(getByPlaceholderText('Amount')).toBeDefined();
  // token description field
  expect(getByPlaceholderText('Destination pubkey')).toBeDefined();

  // trigger token send event
  fireEvent.click(screen.getAllByText(/Send/i)[2]);

  await waitFor(() => getByText('Token sent!'));

  expect(getByText('Token sent!')).toBeDefined();
  expect(getByText('Transaction ID:')).toBeDefined();
  // txid
  expect(getByText('1111111111111111111111111111111111111111111111111111111111111111')).toBeDefined();
  expect(getByText('Open on explorer')).toBeDefined();  
  expect(getByRole('link', {href: 'http://explorer.komodoplatform.com:20000/tokens/7e2b623cb57b44b8dc5d3a3cc36c20d08f66023a85fa2a4490a8fb8783d38347/transactions/1111111111111111111111111111111111111111111111111111111111111111/TKLTEST'})).toBeDefined();
});