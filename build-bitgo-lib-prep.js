const fs = require('fs');

if (process.argv.indexOf('v2') > -1) {
  // quick hack to build bitgo-utxo-lib-cc/samples/cctokenspoc.js for browser
  let libContents = fs.readFileSync('./bitgo-utxo-lib/samples/cctokenspocv2.js', 'utf-8');

  libContents = libContents
  .replace("var ccimp;", '//var ccimp;')
  .replace("ccimp = import('cryptoconditions-js/pkg/cryptoconditions.js');", `console.log("bitgo-lib v2 wasm")`)
  .replace("ccimp = require('cryptoconditions-js/pkg/cryptoconditions.js');", `console.log("bitgo-lib v2 node")`);

  fs.writeFileSync('./bitgo-utxo-lib/samples/cctokenspocv2-temp.js', libContents);

  libContents = fs.readFileSync('./bitgo-utxo-lib/samples/ccassetspocv2.js', 'utf-8');
  
  libContents = libContents
  .replace("var ccimp;", '//var ccimp;')
  .replace("ccimp = import('cryptoconditions-js/pkg/cryptoconditions.js');", `console.log("bitgo-lib v2 wasm")`)
  .replace("ccimp = require('cryptoconditions-js/pkg/cryptoconditions.js');", `console.log("bitgo-lib v2 node")`);

  fs.writeFileSync('./bitgo-utxo-lib/samples/ccassetspocv2-temp.js', libContents);  

  const v2MainImport = `
    const tokensv2 = require('./cctokenspocv2-temp');
    const assetsv2 = require('./ccassetspocv2-temp');

    module.exports = {
      tokensv2,
      assetsv2,
    };
  `;

  fs.writeFileSync('./bitgo-utxo-lib/samples/cctokenspoc-temp.js', v2MainImport);
} else {
  // quick hack to build bitgo-utxo-lib-cc/samples/cctokenspoc.js for browser
  let libContents = fs.readFileSync('./bitgo-utxo-lib/samples/cctokenspoc.js', 'utf-8');

  libContents = libContents
  .replace("var ccimp;", '//var ccimp;')
  .replace("ccimp = import('cryptoconditions-js/pkg/cryptoconditions.js');", `console.log("bitgo-lib v1 wasm")`)
  .replace("ccimp = require('cryptoconditions-js/pkg/cryptoconditions.js');", `console.log("bitgo-lib v1 node")`);

  fs.writeFileSync('./bitgo-utxo-lib/samples/cctokenspoc-temp.js', libContents);
}