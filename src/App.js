import React, {useState, useEffect} from 'react';
import {hot} from 'react-hot-loader';
import {version} from '../package.json';
import Login from './Login';
import Dashboard from './Dashboard';
import Marketplace from './Marketplace';
import writeLog from './log';
import './app.scss';
import './logo.scss';
import './input.scss';
import './order-info.scss';
import './transactions.scss';
import './balance.scss';
import './dashboard.scss';
import './marketplace.scss';

const App = () => {
  const [wif, setWif] = useState('');
  const [address, setAddress] = useState({
    normal: '',
    cc: '',
  });
  const [chain, setChain] = useState();
  const [appVersion, setAppVersion] = useState();
  const [walletView, setWalletView] = useState(true);

  useEffect(() => {
    document.title = `Komodo Tokens Wallet (v${version})`;
  }, []);

  const resetAppState = () => {
    setWif('');
    setAddress({
      normal: '',
      cc: '',
    });
    setChain();
    setAppVersion();
    setWalletView(true);
  };

  const setActiveViewHandler = (e, activeView) => {
    console.warn('activeView', activeView)
    setWalletView(activeView ? true : false);
  };

  const setKeyHandler = ({wif, address, chain}) => {
    setWif(wif);
    setAddress(address);
    setChain(chain);
  };

  useEffect(() => {
    writeLog('app state', {
      address,
      walletView,
      chain
    });
  });

  return(
    <React.Fragment>
      {appVersion &&
        <div className="app-version">v{appVersion}</div>
      }
      {!wif &&
        <Login setKey={setKeyHandler} />
      }
      {wif &&
        <React.Fragment>
          {walletView &&
            <Dashboard
              resetApp={resetAppState}
              setActiveView={setActiveViewHandler}
              walletView={walletView}
              address={address}
              chain={chain}
              wif={wif} />
          }
          {!walletView &&
            <Marketplace
              resetApp={resetAppState}
              setActiveView={setActiveViewHandler}
              walletView={walletView}
              address={address}
              chain={chain}
              wif={wif} />
          }
        </React.Fragment>
      }
    </React.Fragment>
  );
};

export default hot(module)(App);
