// ref: https://github.com/pbca26/agama-wallet-lib/blob/master/src/utils.js#L131

export const convertExponentialToDecimal = (exponentialNumber: number, returnAsString = false): string | number => {
  // sanity check - is it exponential number
  const str = exponentialNumber.toString();
  if (str.indexOf('e') !== -1) {
    const exponent = parseInt(str.split('-')[1], 10);
    // Unfortunately I can not return 1e-8 as 0.00000001, because even if I call parseFloat() on it,
    // it will still return the exponential representation
    // So I have to use .toFixed()
    const result = returnAsString ? exponentialNumber.toFixed(exponent).toString() : exponentialNumber.toFixed(exponent);
    return result;
  } else {
    return returnAsString ? exponentialNumber.toString() : exponentialNumber;
  }
}

// ref: https://github.com/pbca26/agama-wallet-lib/blob/master/src/utils.js#L147
export const fromSats = (value: number): string | number => convertExponentialToDecimal(Number(Number(value * 0.00000001).toFixed(8)));

// ref: https://github.com/pbca26/agama-wallet-lib/blob/master/src/utils.js#L149
export const toSats = (value: number): string | number => Number(Number(value * 100000000).toFixed(0));

// ref: https://github.com/pbca26/agama-wallet-lib/blob/master/src/utils.js#L117
export const getMaxSpendNormalUtxos = (utxoList: any, fee = 10000): number => {
  const maxSpendBalance = utxoList.reduce((accumulator: number, item: any) => accumulator + Number(item.value), -1 * fee);
  
  return Number(maxSpendBalance);
};