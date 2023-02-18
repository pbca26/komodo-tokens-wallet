export interface MarketplaceProps {
  resetApp: Function,
  setActiveView: Function,
  setActiveToken?: Function,
  address: any,
  chain: string,
  tokenBalance?: any,
  tokenList?: any,
  wif: string,
  normalUtxos?: any,
  walletView: boolean,
};