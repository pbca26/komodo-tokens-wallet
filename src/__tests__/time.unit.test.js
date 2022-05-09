import {
  checkTimestamp,
  secondsToString,
} from '../time';

const timeExample = 1519344000000; // 02/23/2018 @ 12:00am (UTC)
const timeExample2 = 1519344060000; // 02/23/2018 @ 12:01am (UTC)

test('it should return 0 (time - checkTimestamp)', () => {
  expect(checkTimestamp(timeExample, timeExample / 1000)).toBe(0);
});

test('it should return 60 (time - checkTimestamp 60s)', () => {
  expect(checkTimestamp(timeExample, timeExample2 / 1000)).toBe(60);
});

test('it should return 23 Feb 2018 00:00 (time - secondsToString)', () => {
  expect(secondsToString(timeExample / 1000)).toBe('23 Feb 2018 03:00');
});

test('it should return 23 Feb 2018 00:00:0 (time - secondsToString)', () => {
  expect(secondsToString(Math.floor(timeExample / 1000), false, true)).toBe('23 Feb 2018 03:00:0');
});