import React from 'react';
import renderer from 'react-test-renderer';
import {render, fireEvent, screen} from '@testing-library/react';
import Login from '../Login';
import '../__mocks__/ccimport';

// TODO: test keying input data actually changes state

test('Login component render check', () => {
  const component = renderer.create(
    <Login />,
  );
  
  let treeJSON = component.toJSON();
  expect(treeJSON).toMatchSnapshot();

  let tree = component.toTree();

  const mProps = {
    setKey: function(obj) {
      expect(obj).toEqual({
        wif: 'UtaKVKuNvDVYxqS8PhRESwKeRYHhzYYkEGgvwEJ9XvghuRVs1VNM',
        address: {
          normal: 'RRF6ocq94kLpaH6wPdZjTqQa9mAmT1GToc',
          cc: 'CaopajuemreFwEAfbywvFi8oFyrJPNkDs1',
          pubkey: '03256ba44eeb188404b94ae8ed64f1fe6ad89580375830845361e365598efa3ff3'
        },
        chain: 'TKLTEST'
      });
    }
  };
  const {getByText, getAllByText, getByPlaceholderText} = render(<Login {...mProps} />);

  // check if all labels/titles/form elements are present
  expect(getAllByText('Login')[0]).toBeDefined();
  expect(getByText('Enter your seed phrase or WIF key in the form below')).toBeDefined();
  expect(getByPlaceholderText('Seed or WIF key')).toBeDefined();
  // check if chain is set to TKLTEST
  expect(tree.instance.state.chain).toBe('TKLTEST');
  expect(getAllByText('TKLTEST')[0]).toBeDefined();
  expect(getAllByText('TKLTEST')[1]).toBeDefined();

  fireEvent.change(getByPlaceholderText('Seed or WIF key'), {target: {value: 'lime lime3'}});
  // trigger login event
  fireEvent.click(screen.getAllByText(/Login/i)[1]);
});