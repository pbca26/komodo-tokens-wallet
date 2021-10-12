echo "building bitgo-utxo-lib"
git clone https://github.com/pbca26/bitgo-utxo-lib -b dimxy-master
node build-bitgo-lib-prep.js
cd bitgo-utxo-lib
npm install
npm install browserify
browserify samples/cctokenspoc-temp.js --standalone tokens -o tokenslib.js
cp tokenslib.js ../src/tokenslib.js
rm samples/cctokenspoc-temp.js
echo "bitgo-utxo-lib build complete"