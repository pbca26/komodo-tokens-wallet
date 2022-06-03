import React from 'react';
import renderer from 'react-test-renderer';
import {render, fireEvent, screen, waitFor} from '@testing-library/react';
import BuyTokenModal from '../BuyTokenModal';
import '../__mocks__/ccimport';
import blockchainMockData from '../__mocks__/blockchain.json';
import {chains} from '../constants';
import 'regenerator-runtime/runtime';

import mockFetch, {mockHeaders} from '../__mocks__/fetch';
import blockchain from '../blockchain';

global.fetch = mockFetch;
blockchain.setFetch(mockFetch, mockHeaders);
blockchain.setExplorerUrl('');

// TODO: (1) test keying input data actually changes state
//       (2) erroneous input

test('BuyTokenModal component render and token sell event check', async () => {
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
    <BuyTokenModal {...mProps} />,
  );
  
  let treeJSON = component.toJSON();
  expect(treeJSON).toMatchSnapshot();

  let tree = component.toTree();

  //console.log(tree.instance.state)
  const {getAllByText, getByText, getByRole, getAllByRole, getByPlaceholderText} = render(<BuyTokenModal {...mProps} />);

  // check if all labels/titles/form elements are present
  expect(getAllByRole('button').length).toBe(3);
  
  // form name
  expect(getByText('Bid')).toBeDefined();
  // submit button
  expect(getByText('Buy')).toBeDefined();
  
  // form labels
  expect(getByText('Place token buy order')).toBeDefined();
  expect(getByText('Fill out the form below')).toBeDefined();

  // token selector
  expect(getAllByText('Dr Dead')).toBeDefined();
  // token amount field
  expect(getByPlaceholderText('Amount (qty)')).toBeDefined();
  // token price field
  expect(getByPlaceholderText('Price in TKLTEST')).toBeDefined();

  // trigger token buy event
  console.log(screen.getByText('Buy'))
  fireEvent.click(screen.getByText('Buy'));

  await waitFor(() => getByText('Token buy order placed!'));

  expect(getByText('Token buy order placed!')).toBeDefined();
  expect(getByText('Transaction ID:')).toBeDefined();
  // txid
  expect(getByText('1111111111111111111111111111111111111111111111111111111111111111')).toBeDefined();
  expect(getByText('Open on explorer')).toBeDefined();  
  expect(getByRole('link', {href: 'http://explorer.komodoplatform.com:20000/tokens/37585125416dfddcb8c8a67a348eaf5d50637f2ce34d47d62f33f14add7c0e97/transactions/1111111111111111111111111111111111111111111111111111111111111111/TKLTEST'})).toBeDefined();
});