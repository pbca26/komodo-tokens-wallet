echo "building bitgo-utxo-lib"
rm -rf bitgo-utxo-lib
if test "$1" = 'v2'; then
  echo "bitgo-utxo-lib v2"
  git clone https://github.com/pbca26/bitgo-utxo-lib -b dimxy-tokel
  node build-bitgo-lib-prep.js v2
else
  echo "bitgo-utxo-lib v1"
  git clone https://github.com/pbca26/bitgo-utxo-lib -b dimxy-master
  node build-bitgo-lib-prep.js
fi
cd bitgo-utxo-lib
yarn install
yarn add browserify
browserify samples/cctokenspoc-temp.js --standalone tokens -o tokenslib.js
if test "$1" = 'v2'; then
  cp tokenslib.js ../src/tokenslib-v2.js
else
  cp tokenslib.js ../src/tokenslib.js
fi
rm samples/cctokenspoc-temp.js
echo "bitgo-utxo-lib build complete"