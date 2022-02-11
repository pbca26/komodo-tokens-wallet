/*
 *  usage node make-token-json-list
 *  it will generate an array of tokens formatted to be used in batch create token modal 
 */

let tokens = [];
const total = 1;
const numStart = 1;

const arbitrary = JSON.stringify({"some key": "some prop"}); //Buffer.from('{"some key": "some prop"}').toString('hex');

for (var i = 0; i < total; i++) {
  tokens.push({
    "name": "nft-token" + (numStart + i),
    "supply": 1,
    "description": "Some description" + (numStart + i),
    "nft": "{\"url\": \"someurl" + (numStart + i) +"\", \"arbitrary\": " + arbitrary + "}"
  });
}

console.log(JSON.stringify(tokens, null, 2));