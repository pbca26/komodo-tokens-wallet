import React from 'react';
import renderer from 'react-test-renderer';
import {render, fireEvent, screen, waitFor} from '@testing-library/react';
import Dashboard from '../Dashboard';
import blockchainMockData from '../__mocks__/blockchain.json';
import 'regenerator-runtime/runtime';

import mockFetch, {mockHeaders} from '../__mocks__/fetch';
import blockchain from '../blockchain';

global.fetch = mockFetch;
blockchain.setFetch(mockFetch, mockHeaders);
blockchain.setExplorerUrl('');

// TODO: test dynamic elements/triggers

test('Dashboard component render check', async() => {
  const mProps = {
    wif: 'UtaKVKuNvDVYxqS8PhRESwKeRYHhzYYkEGgvwEJ9XvghuRVs1VNM',
    address: {
      normal: 'RRF6ocq94kLpaH6wPdZjTqQa9mAmT1GToc',
      cc: 'CaopajuemreFwEAfbywvFi8oFyrJPNkDs1',
      pubkey: '03256ba44eeb188404b94ae8ed64f1fe6ad89580375830845361e365598efa3ff3'
    },
    chain: 'TKLTEST',
  };

  const component = renderer.create(
    <Dashboard {...mProps} />,
  );
  
  let treeJSON = component.toJSON();
  expect(treeJSON).toMatchSnapshot();

  let tree = component.toTree();
  console.log(tree.instance.state)
  const {getByText, getAllByText, getByPlaceholderText, getAllByTestId} = render(<Dashboard {...mProps} />);

  // tabs
  expect(getByText(/Wallet/)).toBeDefined();
  expect(getByText(/Marketplace/)).toBeDefined();
  
  // address info
  expect(getByText('My Normal address:')).toBeDefined();
  expect(getByText('RRF6ocq94kLpaH6wPdZjTqQa9mAmT1GToc')).toBeDefined();
  expect(getByText('My CC address:')).toBeDefined();
  expect(getByText('CaopajuemreFwEAfbywvFi8oFyrJPNkDs1')).toBeDefined();
  expect(getByText('My pubkey:')).toBeDefined();
  expect(getByText('03256ba44eeb188404b94ae8ed64f1fe6ad89580375830845361e365598efa3ff3')).toBeDefined();

  // holdings block
  expect(getByText('Current holdings')).toBeDefined();

  // holdings block
  expect(getByText('Last transactions')).toBeDefined();
  expect(getAllByText('Create')).toBeDefined();

  // transactions block
  expect(getByText('No transactions history')).toBeDefined();

  // wait for blockchain data to load

  await waitFor(() => getAllByText('NFTJS'));

  // address balance
  expect(getByText('Normal balance:')).toBeDefined();
  expect(getByText(0.19126885)).toBeDefined();
  expect(getByText('TKLTEST')).toBeDefined();

  // send button visible
  expect(getAllByText('Send')).toBeDefined();

  // check all token tiles are rendered
  //console.log(getAllByTestId(/token-tile/))
  expect(getAllByTestId(/token-tile/).length).toBe(13);

  // check all token transactions are rendered
  expect(getAllByTestId(/token-transaction/).length).toBe(28);
});