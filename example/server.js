var express = require('express');
var fs = require('fs');
var https = require('https');

//"hound" module contains both client-side ("Hound") and server-side ("HoundNode") parts of SDK
var hound = require('hound').HoundNode;

//parse arguments
var argv = require('minimist')(process.argv.slice(2));

//config file
var configFile = argv.config || 'config';
var config = require(__dirname + '/' + configFile);

//express app
var app = express();
var publicFolder = argv.public || 'public';
app.use(express.static(__dirname + '/' + publicFolder));

//authenticates voice search requests
app.get('/voiceSearchAuth', hound.createVoiceAuthHandler({ 
  clientId:  config.clientId, 
  clientKey: config.clientKey
}));

//sends the request to Hound backend with authentication headers
app.get('/textSearchProxy', hound.createTextProxyHandler({ 
  clientId:  config.clientId, 
  clientKey: config.clientKey
}));


//ssl credentials
var privateKey = fs.readFileSync(config.sslKeyFile);
var certificate = fs.readFileSync(config.sslCrtFile);
var credentials = { key: privateKey, cert: certificate };

//https server
var httpsServer = https.createServer(credentials, app);
var port = config.port || 8446;
httpsServer.listen(port, function() {
  console.log("HTTPS server running on port", port);
  console.log("Open https://localhost:" + port, "in the browser to view the Web SDK demo");
});