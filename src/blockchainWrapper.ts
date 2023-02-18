import insight from './blockchain';
import mock from './blockchainMock';

const blockchain: { [key: string]: any } = {
  default: insight,
  mock,
}

export default blockchain;