export interface DashboardProps {
  resetApp: Function,
  setActiveView: Function,
  address: any,
  chain: string,
  tokenBalance?: any,
  tokenList?: any,
  wif: string,
  normalUtxos?: any,
  walletView: boolean,
  isDemo: boolean,
};