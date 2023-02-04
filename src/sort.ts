// ref: https://github.com/pbca26/agama-wallet-lib/blob/master/src/utils.js#L1
export const sortTransactions = (transactions: any, sortBy='height') => {
  return transactions.sort((b: any, a: any) => {
    if (a[sortBy] < b[sortBy] &&
        a[sortBy] &&
        b[sortBy]) {
      return -1;
    }

    if (a[sortBy] > b[sortBy] &&
        a[sortBy] &&
        b[sortBy]) {
      return 1;
    }

    if (!a[sortBy] &&
        b[sortBy]) {
      return 1;
    }

    if (!b[sortBy] &&
        a[sortBy]) {
      return -1;
    }

    return 0;
  });
}