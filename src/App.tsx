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

const App: React.FC = () => {
  const [wif, setWif] = useState('');
  const [address, setAddress] = useState({
    normal: '',
    cc: '',
  });
  const [chain, setChain] = useState();
  const [appVersion, setAppVersion] = useState(version);
  const [walletView, setWalletView] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    document.title = `Komodo Tokens Wallet (v${appVersion})`;
  }, []);

  const resetAppState = () => {
    setWif('');
    setAddress({
      normal: '',
      cc: '',
    });
    setChain(undefined);
    setAppVersion(version);
    setWalletView(true);
    setIsDemo(false);
  };

  const setActiveViewHandler = (e: any, activeView: any) => {
    writeLog('activeView', activeView);
    setWalletView(activeView ? true : false);
  };

  const setKeyHandler = (arg: any) => {
    const {wif, address, chain} = arg;
    
    setWif(wif);
    setAddress(address);
    setChain(chain);
  };

  useEffect(() => {
    writeLog('app state', {
      address,
      walletView,
      chain,
      isDemo
    });
  });

  return(
    <React.Fragment>
      {appVersion &&
        <div className="app-version">v{appVersion}</div>
      }
      {!wif &&
        <Login
          setKey={setKeyHandler}
          setIsDemo={setIsDemo}
          isDemo={isDemo} />
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
              wif={wif}
              isDemo={isDemo} />
          }
          {!walletView &&
            <Marketplace
              resetApp={resetAppState}
              setActiveView={setActiveViewHandler}
              walletView={walletView}
              address={address}
              chain={chain}
              wif={wif}
              isDemo={isDemo} />
          }
        </React.Fragment>
      }
    </React.Fragment>
  );
};

export default hot(module)(App);
