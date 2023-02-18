export interface IChain {
  ccLibVersion: number,
  ccIndex?: boolean,
  explorerApiVersion?: number,
  faucetURL?: string,
  txBuilderApi: string, // default|insight|utxoSelect
  explorerUrl: string,
  explorerApiUrl: string,
  enabled: boolean,
  isRaddress?: boolean,
};

export interface IChains {
	[key: string]: IChain,
};