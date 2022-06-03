import React from 'react';
import renderer from 'react-test-renderer';
import {render, fireEvent, screen, waitFor} from '@testing-library/react';
import FillBidTokenModal from '../FillBidTokenModal';
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

test('FillBidTokenModal component render and token fill bid order event check', async () => {
  const mProps = {
    tokenList: blockchainMockData.tokens.tokens,
    order: {
      'funcid': 'b',
      'txid': 'f196eefba29cfa1e8636ac97d0bd51196b062b4757107ef8e192d2164b1c8b06',
      'bidamount': 0.00001,
      'origaddress': 'CHpN2oZ8oCdjR8sS85NEZEDe9nrVYwQP6E',
      'origtokenaddress': 'CaopajuemreFwEAfbywvFi8oFyrJPNkDs1',
      'tokenid': '7e2b623cb57b44b8dc5d3a3cc36c20d08f66023a85fa2a4490a8fb8783d38347',
      'totalrequired': 1,
      'price': 0.00001,
      'ExpiryHeight': 209614
    },
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
    <FillBidTokenModal {...mProps} />,
  );
  
  let treeJSON = component.toJSON();
  expect(treeJSON).toMatchSnapshot();

  let tree = component.toTree();

  console.log(tree.instance.state)
  const {getAllByText, getByText, getByRole, getAllByRole, getByPlaceholderText, getByDisplayValue} = render(<FillBidTokenModal {...mProps} />);

  // check if all labels/titles/form elements are present
  expect(getAllByRole('button').length).toBe(2);
  expect(getAllByRole('textbox').length).toBe(4);
  
  // form name
  expect(getByText('Sell token')).toBeDefined();
  expect(getByText('Fill out the form below')).toBeDefined();
  // submit button
  expect(getAllByText('Sell')).toBeDefined();
  
  // token name
  expect(getByDisplayValue('Token: NFTJS')).toBeDefined();
  // token fill amount
  expect(getByPlaceholderText('Amount (qty)')).toBeDefined();
  // token order price per unit
  expect(getByDisplayValue('Price: 0.00001')).toBeDefined();
  // token order total price
  expect(getByDisplayValue('Total: 0.00001')).toBeDefined();
  
  // trigger token fill bid event
  fireEvent.click(screen.getAllByText('Sell')[1]);

  await waitFor(() => getByText('Token sell order filled!'));

  expect(getByText('Token sell order filled!')).toBeDefined();
  expect(getByText('Transaction ID:')).toBeDefined();
  // txid
  expect(getByText('1111111111111111111111111111111111111111111111111111111111111111')).toBeDefined();
  expect(getByText('Open on explorer')).toBeDefined();  
  expect(getByRole('link', {href: 'http://explorer.komodoplatform.com:20000/tokens/7e2b623cb57b44b8dc5d3a3cc36c20d08f66023a85fa2a4490a8fb8783d38347/transactions/1111111111111111111111111111111111111111111111111111111111111111/TKLTEST'})).toBeDefined();
});