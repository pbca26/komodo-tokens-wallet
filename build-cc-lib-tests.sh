# execute this script only if you need to run test suite
echo "building cryptoconditions-js"
rm -rf cryptoconditions-js-tests
git clone https://github.com/dimxy/cryptoconditions-js cryptoconditions-js-tests
cd cryptoconditions-js-tests
echo "wasm-pack build --target nodejs cryptoconditions-js"
echo "it may take a while..."
wasm-pack build --target nodejs
echo "cryptoconditions-js build complete"