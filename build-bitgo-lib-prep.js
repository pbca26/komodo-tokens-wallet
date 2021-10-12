const fs = require('fs');

// quick hack to build bitgo-utxo-lib-cc/samples/cctokenspoc.js for browser
let libContents = fs.readFileSync('./bitgo-utxo-lib/samples/cctokenspoc.js', 'utf-8');

libContents = libContents
.replace("var ccimp;", '//var ccimp;')
.replace("ccimp = import('cryptoconditions-js/pkg/cryptoconditions.js');", 'console.log("bitgo-lib wasm")')
.replace("ccimp = require('cryptoconditions-js/pkg/cryptoconditions.js');", 'console.log("bitgo-lib node")');

fs.writeFileSync('./bitgo-utxo-lib/samples/cctokenspoc-temp.js', libContents);