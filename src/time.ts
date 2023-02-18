// ref: https://github.com/pbca26/agama-wallet-lib/blob/master/src/time.js#L1
export const secondsToString = (seconds: number, skipMultiply?: boolean, showSeconds?: boolean) => {
  const a = new Date(seconds * (skipMultiply ? 1 : 1000));
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const year = a.getFullYear();
  const month = months[a.getMonth()];
  const date = a.getDate();
  const hour = a.getHours() < 10 ? `0${a.getHours()}` : a.getHours();
  const min = a.getMinutes() < 10 ? `0${a.getMinutes()}` : a.getMinutes();
  const sec = a.getSeconds();
  const time = `${date} ${month} ${year} ${hour}:${min}${(showSeconds ? `:${sec}` : '')}`;

  return time;
};

// ref: https://github.com/pbca26/agama-wallet-lib/blob/master/src/time.js#L28
export const checkTimestamp = (dateToCheck: number, currentEpochTime = Date.now() / 1000) => {
  const secondsElapsed = Number(currentEpochTime) - Number(dateToCheck / 1000);

  return Math.floor(secondsElapsed);
};