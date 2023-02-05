import {IChain} from './chain'

export type TransactionDetailsModalProps = {
  transaction: any,
  chainInfo: IChain,
  tokenInfo: any,
  chain: string,
  directionClass: string,
  children: JSX.Element,
};