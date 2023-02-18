import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import App from './App';

// Opt-in to Webpack hot module replacement
if (module.hot) module.hot.accept();

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);