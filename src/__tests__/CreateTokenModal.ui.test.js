import React from 'react';
import renderer from 'react-test-renderer';
import {render, fireEvent, screen, waitFor} from '@testing-library/react';
import CreateTokenModal from '../CreateTokenModal';
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

test('CreateTokenModal component render and token create event check', async () => {
  const mProps = {
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
    <CreateTokenModal {...mProps} />,
  );
  
  let treeJSON = component.toJSON();
  expect(treeJSON).toMatchSnapshot();

  let tree = component.toTree();

  //console.log(tree.instance.state)
  const {getAllByText, getByText, getByRole, getAllByRole, getByPlaceholderText} = render(<CreateTokenModal {...mProps} />);

  // check if all labels/titles/form elements are present
  expect(getAllByRole('button').length).toBe(3);
  
  // form name
  expect(getAllByText('Create')[0]).toBeDefined();
  // submit button
  expect(getAllByText('Create')[1]).toBeDefined();
  
  // form labels
  expect(getByText('New token')).toBeDefined();
  expect(getByText('Provide token details in the form below')).toBeDefined();

  // token name field
  expect(getByPlaceholderText('Token name')).toBeDefined();
  // token name field
  expect(getByPlaceholderText('Token supply')).toBeDefined();
  // token description field
  expect(getByPlaceholderText('Token description')).toBeDefined();
  // token NFT data field
  expect(getByPlaceholderText('Token NFT data (optional)')).toBeDefined();

  // trigger token create event
  fireEvent.click(screen.getAllByText(/Create/i)[1]);

  await waitFor(() => getByText('Token created!'));

  expect(getByText('Token created!')).toBeDefined();
  expect(getByText('Transaction ID:')).toBeDefined();
  // txid
  expect(getByText('1111111111111111111111111111111111111111111111111111111111111111')).toBeDefined();
  expect(getByText('Open on explorer')).toBeDefined();  
  expect(getByRole('link', {href: 'http://explorer.komodoplatform.com:20000/tokens/1111111111111111111111111111111111111111111111111111111111111111/transactions/TKLTEST'})).toBeDefined();
});