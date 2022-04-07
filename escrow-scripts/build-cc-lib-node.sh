rm -rf bitgo-utxo-lib
git clone https://github.com/pbca26/bitgo-utxo-lib -b dimxy-tokel
cd bitgo-utxo-lib
npm install
cd node_modules
echo "building cryptoconditions-js"
rm -rf cryptoconditions-js
git clone https://github.com/dimxy/cryptoconditions-js
cd cryptoconditions-js
echo "wasm-pack build -t nodejs cryptoconditions-js"
echo "it may take a while..."
wasm-pack build -t nodejs
echo "cryptoconditions-js build complete"
npm install node-fetch@2.6.0