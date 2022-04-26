import './debug-util';

export const writeLog = window.DEBUG ? console.warn : () => {};

export default writeLog;