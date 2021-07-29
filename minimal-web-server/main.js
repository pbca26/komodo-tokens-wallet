const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
let app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  next();
});

app.use(bodyParser.json({ limit: '5mb' })); // support json encoded bodies
app.use(bodyParser.urlencoded({
  limit: '5mb',
  extended: true,
})); // support encoded bodies

// router
app.use(express.static('./public'));

let server;
const config = {
  ip: 'localhost',
  https: false,
  port: 21000,
};

if (config.https) {
  const options = {
    key: fs.readFileSync('certs/priv.pem'),
    cert: fs.readFileSync('certs/cert.pem'),
  };
  server = require('https')
            .createServer(options, app)
            .listen(config.port, config.isDev ? 'localhost' : config.ip);
} else {
  server = require('http')
            .createServer(app)
            .listen(config.port, config.isDev ? 'localhost' : config.ip);
}

console.log(`Tokens Web Wallet server is running`);