echo "building cryptoconditions-js"
git clone https://github.com/dimxy/cryptoconditions-js
cd cryptoconditions-js
echo "wasm-pack build cryptoconditions-js"
echo "it may take a while..."
wasm-pack build
echo "cryptoconditions-js build complete"