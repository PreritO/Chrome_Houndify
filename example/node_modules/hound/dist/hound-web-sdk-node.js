'use strict';

var crypto = require('crypto');
var uuid = require('node-uuid');
var request = require('request');


function convertBase64URL(encoded, isURL) {
  if (isURL) {
    encoded = encoded.replace(/-/g, "+");
    encoded = encoded.replace(/_/g, "/");
  } else {
    encoded = encoded.replace(/\+/g, "-");
    encoded = encoded.replace(/\//g, "_");
  }

  return encoded;
}

function signToken(token, clientKey) {
  var accessKeyBin = new Buffer(convertBase64URL(clientKey, true), "base64");
  var hmac = crypto.createHmac('sha256', accessKeyBin);
  hmac.setEncoding('base64');
  hmac.write(token);
  hmac.end();
  return convertBase64URL(hmac.read(), false);
}


function generateAuthHeaders(clientId, clientKey, userId, requestId, timestamp) {

    if (!clientId || !clientKey) {
        throw new Error('Must provide a Client ID and a Client Key');
    }

    userId      = userId || uuid.v1();
    requestId   = requestId || uuid.v1();

    var requestData = userId + ';' + requestId,
        timestamp   = timestamp || Math.floor(Date.now() / 1000), 

        unescapeBase64Url = function (key) {
            return key.replace(/-/g, '+').replace(/_/g, '/');
        },

        escapeBase64Url = function (key) {
            return key.replace(/\+/g, '-').replace(/\//g, '_');
        },

        signKey = function (clientKey, message) {
            var key = new Buffer(unescapeBase64Url(clientKey), 'base64');
            var hash = crypto.createHmac('sha256', key).update(message).digest('base64');
            return escapeBase64Url(hash);
        },

        encodedData = signKey(clientKey, requestData + timestamp),
        headers = {
            'Hound-Request-Authentication': requestData,
            'Hound-Client-Authentication': clientId + ';' + timestamp + ';' + encodedData
        };

    return headers;
}



module.exports =  {

  signToken: signToken,

  generateAuthHeaders: generateAuthHeaders,

  createVoiceAuthHandler: function(opts) {  

    return function (req, res) {
      if (!req.query.hasOwnProperty("token")) {
        res.send({ 'status': 'error', 'message': 'no token provided' });
        return;
      }
      res.send({ 'access_id': opts.clientId, 'signature': signToken(req.query.token, opts.clientKey) });
    }

  },

  createTextProxyHandler: function(opts) {

    return function (req, res) {
      var _opts = opts || {};

      var query = req.query.query;
      var clientId = req.query.clientId || opts.clientId;
      var clientKey = req.query.clientKey || opts.clientKey;
      var requestInfo = {};
      try {
        requestInfo = JSON.parse(req.headers["hound-request-info"]); 
      } catch(e) {}
      
      var UserID = requestInfo["UserID"] || null;
      var TimeStamp = requestInfo["TimeStamp"] || null;
      var RequestID = requestInfo["RequestID"] || null;

      var headers = generateAuthHeaders(clientId, clientKey, UserID, RequestID, TimeStamp); 

      request({
        url: _opts.houndBackend || "https://api.houndify.com/v1/text",
        qs: {
          query: query
        },
        agent: _opts.agent,
        method: 'POST',
        headers: {
          'Hound-Request-Authentication': headers['Hound-Request-Authentication'],
          'Hound-Client-Authentication' : headers['Hound-Client-Authentication'],
          'Hound-Request-Info': req.headers["hound-request-info"]
        },
        json: true
      }, function (err, resp, body) {
        if (err) return res.send({ error: err.toString() });
        res.send(body);
      });
    }

  }
  
}
