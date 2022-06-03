import React from 'react';
import renderer from 'react-test-renderer';
import {render, fireEvent, screen, waitFor} from '@testing-library/react';
import FillAskTokenModal from '../FillAskTokenModal';
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

test('FillAskTokenModal component render and token fill ask order event check', async () => {
  const mProps = {
    tokenList: blockchainMockData.tokens.tokens,
    order: {
      'funcid': 's',
      'txid': '572663bb71d9822cf70d60ed4d180300f61bf8790dc5c2023d1888f1b8e8c254',
      'askamount': 2,
      'origaddress': 'CHpN2oZ8oCdjR8sS85NEZEDe9nrVYwQP6E',
      'origtokenaddress': 'CaopajuemreFwEAfbywvFi8oFyrJPNkDs1',
      'tokenid': 'b8ceac7c2130b9a44fd11a1b67f4fa7b7a908b9f9a58e4f0024acd3b486b7a90',
      'totalrequired': 0.0002,
      'price': 0.0001,
      'ExpiryHeight': 167549,
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
    <FillAskTokenModal {...mProps} />,
  );
  
  let treeJSON = component.toJSON();
  expect(treeJSON).toMatchSnapshot();

  let tree = component.toTree();

  //console.log(tree.instance.state)
  const {getAllByText, getByText, getByRole, getAllByRole, getByPlaceholderText, getByDisplayValue} = render(<FillAskTokenModal {...mProps} />);

  // check if all labels/titles/form elements are present
  expect(getAllByRole('button').length).toBe(2);
  expect(getAllByRole('textbox').length).toBe(4);
  
  // form name
  expect(getByText('Buy token')).toBeDefined();
  expect(getByText('Fill out the form below')).toBeDefined();
  // submit button
  expect(getAllByText('Buy')).toBeDefined();
  
  // token name
  expect(getByDisplayValue('Token: Test9')).toBeDefined();
  // token fill amount
  expect(getByPlaceholderText('Amount (qty)')).toBeDefined();
  // token order price per unit
  expect(getByDisplayValue('Price: 0.0001')).toBeDefined();
  // token order total price
  expect(getByDisplayValue('Total: 0.0001')).toBeDefined();
  
  // trigger token fill ask event
  fireEvent.click(screen.getAllByText('Buy')[1]);

  await waitFor(() => getByText('Token buy order filled!'));

  expect(getByText('Token buy order filled!')).toBeDefined();
  expect(getByText('Transaction ID:')).toBeDefined();
  // txid
  expect(getByText('1111111111111111111111111111111111111111111111111111111111111111')).toBeDefined();
  expect(getByText('Open on explorer')).toBeDefined();  
  expect(getByRole('link', {href: 'http://explorer.komodoplatform.com:20000/tokens/b8ceac7c2130b9a44fd11a1b67f4fa7b7a908b9f9a58e4f0024acd3b486b7a90/transactions/1111111111111111111111111111111111111111111111111111111111111111/TKLTEST'})).toBeDefined();
});