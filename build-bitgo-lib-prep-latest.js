const fs = require('fs');

// quick hack to build latest bitgo-utxo-lib-cc for browser
let libContents = fs.readFileSync('./src/tokenslib-v2.js', 'utf-8');

libContents = libContents
.replace(/ccbasic.cryptoconditions = await ccimp/g, 'ccbasic.cryptoconditions = window.ccimp')
.replace(/exports.cryptoconditions/g, 'window.ccimp')

fs.writeFileSync('./src/tokenslib-v2.js', libContents);