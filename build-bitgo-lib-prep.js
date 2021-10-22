const fs = require('fs');

// quick hack to build bitgo-utxo-lib-cc/samples/cctokenspoc.js for browser
let libContents = fs.readFileSync(`./bitgo-utxo-lib/samples/cctokenspoc${process.argv.indexOf('v2') > -1 ? 'v2' : ''}.js`, 'utf-8');

libContents = libContents
.replace("var ccimp;", '//var ccimp;')
.replace("ccimp = import('cryptoconditions-js/pkg/cryptoconditions.js');", `console.log("bitgo-lib ${process.argv.indexOf('v2') > -1 ? 'v2' : 'v1'} wasm")`)
.replace("ccimp = require('cryptoconditions-js/pkg/cryptoconditions.js');", `console.log("bitgo-lib ${process.argv.indexOf('v2') > -1 ? 'v2' : 'v1'} node")`);

fs.writeFileSync('./bitgo-utxo-lib/samples/cctokenspoc-temp.js', libContents);