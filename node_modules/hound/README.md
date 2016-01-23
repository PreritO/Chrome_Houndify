# Houndify Web SDK

The Houndify Web SDK allows you to make voice and text queries to the Houndify API from your browser.

## Features

* Voice search (Chrome, Firefox)
* Text search (Chrome, Firefox, Safari, IE)
* Conversation state
* Voice Activity Detection

## Structure

Web SDK consists of two parts: an in-browser javascript library and a server-side node module.

**hound-web-sdk.min.js** is the main part and it runs in the browser. It captures audio and text requests, and processes responses from the backend.

Because of CORS and security issues we also need a backend part that stores client credentials (Houndify Client ID and Client Key) and acts as a proxy for http requests from browser to Hound backend. Server-side part of SDK is a node module **hound** that contains `HoundNode` object with two methods that build express middlewares for authentication/proxy and two more helper methods.

## Set up

### Client Side

Client-side part of Web SDK doesn't have any dependencies right now and consists of a single 725Kb file. You can include it via script tag and work with global `Hound` object.

```html
<script src="/path/to/hound-web-sdk.min.js"></script>
<script>
var searchObject = new Hound.TextSearch(/* ..args.. */);
</script>
```

Or you can *require* `Hound` as a CommonJS module.

```javascript
var Hound = require('path/to/hound-web-sdk.min'); //or require('hound').Hound

var searchObject = new Hound.TextSearch(/* ..args.. */);
```

### Server Side

Server-side part of SDK is in the a **hound** node module [that also includes client-side `Hound`]. 

**The module is not yet published to npm but is packed into hound-VERSION.tgz. You can run `npm install hound-VERSION.tgz` to install it.**

`HoundNode` object in the module has four methods used for authenticating and proxying voice and text search requests.

```javascript
var hound = require('hound').HoundNode;
```

### Example Project

*example* folder contains a project that shows a working setup of SDK. It contains a node *server.js* and *public* folder with frontend. 

`npm install` should install both **express** from npm and **hound** from *hound-VERSION.tgz*. 

You'll need to fill in your Houndify Client information in *config.json*. Make sure you also change "YOUR_CLIENT_ID" with your actual client id in `requestInfo` in *example/public/index.html* file.

You will also need ssl certificate and key files for starting https server. **Latest browsers require secure connection for access to microphone.** Add *server.key* and *server.crt* files to the project root.

Run `node server.js` in the project folder and go to the url shown in the output of the running node server. Default one is https://localhost:3446.

## Using SDK

`Hound` object contains two constructors for search objects, `TextSearch` and `VoiceSearch`, and a constructor for `Conversation` object that is used to store conversation state.

```javascript
var searchObject = new TextSearch({
  proxy: {
    route: "/textSearchProxy"
  },
  onResponse: function(response, info) {
    /* handle response here */
  }
});

searchObject.search(
  "What is the weather like in Toronto?",  // query
  {                                        // request info
    UserID: "as124faa12",  
    City: "Toronto", 
    Country: "Canada"
  }
);
```

### Voice Search

In order to use Voice Search you'll need an authentication endpoint on your server. **hound** module contains `HoundNode` object with *createVoiceAuthHandler()* method that takes Houndify ClientID and ClientKey and creates an express middleware for handling voice search authentication.

**Note!** For voice search to work the frontend should be served through secure connection. See example project for https node server setup.

```javascript
var hound = require('hound').HoundNode;

/* create an express app*/

//authenticates voice search requests
app.get('/voiceSearchAuth', hound.createVoiceAuthHandler({ 
  clientId:  "YOUR_CLIENT_ID", 
  clientKey: "YOUR_CLIENT_KEY"
}));
```

In the browser you need to create a **VoiceSearch** object that expects authentication endpoint, `Conversation` object and several event handlers passed in the options:

```javascript
var voiceSearch = new Hound.VoiceSearch({

  //You need to create an endpoint on your server
  //for handling the authentication.
  //See SDK's server-side method HoundNode.createVoiceAuthHandler().
  authenticationURI: "/voiceSearchAuth",

  //Create one global Conversation object 
  //to share the conversation state between Text and Voice Search objects
  conversation: new Hound.Conversation(),

  //Enable Voice Activity Detection
  //Default: true
  enableVAD: true,

  //Listeners

  //Fires every time backend sends a speech-to-text 
  //transcript of a voice query
  //See https://houndify.com/reference/HoundPartialTranscript
  onTranscriptionUpdate: function(transcript) {},

  //Fires after server responds with Response JSON
  //Info object contains useful information about the completed request
  //See https://houndify.com/reference/HoundServer
  onResponse: function(response, info) {},

  //Fires after abort() method is called on search object
  onAbort: function(info) {},

  //Fires if error occurs during the request
  onError: function(err, info) {},

  //Fires when start() metods is called on search object
  onRecordingStarted: function() {},

  //Fires when recording ends either after stop(), abort() or
  //when server detects the end of query and responds 
  //(VAD: https://houndify.com/docs#voice-activity-detection)
  onRecordingStopped: function(recording) {},

  //Fires every time new audio frame of recording is captured
  onAudioFrame: function(frame) {}
});
```

Created `VoiceSearch` object will have five methods *start()*, *stop()*, *abort()*, *upload()* and *destroy()*.

```javascript
//see https://houndify.com/reference/RequestInfo
var requestInfo = { 
  UserID: "as124faa12", 
  City: "Toronto", 
  Country: "Canada"
};

//starts streaming of voice search requests to Hound backend
voiceSearch.start(requestInfo);

/* ... */

//stops streaming voice search requests, expects the final response from backend
voiceSearch.stop();

/* ... */

//aborts voice search request, does not expect final response from backend
voiceSearch.abort();

/* ... */

// pass arrayBuffer from WAV file 
// to voiceSearch.upload() along with requestInfo 
// to get voice search results for pre-recorded audio.
// The audio should have sampling rate of at least 16KHz.
// NOTE: "fileInput" element is some <input type="file" id="fileInput" onchange="onFileUpload()" /> in your html
function onFileUpload() {
  var fileElt = document.getElementById("fileInput");
  var file = fileElt.files[0];
  if (!file) return;

  var reader = new FileReader();
  reader.onload = function(){
    var arrayBuffer = reader.result;
    voiceSearch.upload(arrayBuffer, requestInfo);
  };

  reader.readAsArrayBuffer(file);
}

/* ... */

// destroy the existing voiceSearch object if you need to create a new one.
// browsers have limits on number of AudioContext objects in a single session
voiceSearch.destroy()
```

### Text Search

Setting up Text Search is similar to Voice Search.

In order to use Text Search you'll need an authentication/proxy endpoint on your server. `HoundNode` object contains *createTextProxyHandler()* method that takes Houndify ClientID and ClientKey for handling text search requests.

```javascript
var hound = require('hound').HoundNode;

/* create an express app*/

// Send the request to http text endpoint with authentication headers
app.get('/textSearchProxy', hound.createTextProxyHandler({ 
  clientId:  "YOUR_CLIENT_ID", 
  clientKey: "YOUR_CLIENT_KEY"
}));
```

In the browser you need to create a `TextSearch` object that expects proxy endpoint details, `Conversation` object and two event handlers passed in the options:

```javascript
var textSearch = new Hound.TextSearch({

  //You need to create an endpoint on your server
  //for handling the authentication and proxying 
  //text search http requests to Hound backend
  //See SDK's server-side method HoundNode.createTextProxyHandler().
  proxy: {
    route: "/textSearchProxy",
    // method: "GET",
    // headers: []
    // ... More proxy options will be added as needed
  },

  //Create one global Conversation object 
  //to share the conversation state between Text and Voice Search objects
  conversation: new Hound.Conversation(),

  //Listeners

  //Fires after server responds with Response JSON
  //Info object contains useful information about the completed request
  //See https://houndify.com/reference/HoundServer
  onResponse: function(response, info) {},

  //Fires if error occurs during the request
  onError: function(err, info) {}
});
```

Created `TextSearch` object will have *search()* method that accepts a query string and request info object.

```javascript
//see https://houndify.com/reference/RequestInfo
var requestInfo = { 
  UserID: "as124faa12", 
  City: "Toronto", 
  Country: "Canada"
};

var query = "What is the weather like in Toronto?";

//starts streaming of voice search requests to Hound backend
textSearch.search(query, requestInfo);
```

### Conversation State

Houndified domains can use context to enable a conversational user interaction. For example, users can say "show me coffee shops near me", "which ones have wifi?", "sort by rating", "navigate to the first one". In order to store and share conversation between text and voice queries you can create a `Conversation` object and pass it to search objects.

```javascript
var myConversation = new Hound.Conversation();

var voiceSearch = new VoiceSearch({
  conversation: myConversation,

  /* other options... */
});

var textSearch = new TextSearch({
  conversation: myConversation,

  /* other options... */
});
```

You may call *clear()* method on `Conversation` object in order to forget the conversation.


```javascript
var myConversation = new Hound.Conversation();

/* ... */

myConversation.clear();
```

## Extra

### Voice Search without Server-side module

You can use Voice Search in the browser without setting up node server. You can pass in the authentication information directly to `VoiceSearch` object and use a https server of your choice without server-side **hound** module. 

**Important!** Your client key should be private and it is not recommended to expose it in the browser in production. Use Voice Search without authentication through server side only for testing the platform or internal applications.

```javascript
var voiceSearch = new Hound.VoiceSearch({
  // Provide client information here
  // to skip the authentication on server side
  client: {
    clientId: "YOUR_CLIENT_ID",
    clientKey: "YOUR_CLIENT_KEY"
  },

  /* other options... */
});
```

### Other HoundNode Methods

Server-side node module **hound** has four methods, two of which are mentioned above (creating express middleware for authentication and proxying requests). There are two more helper methods in the `HoundNode` object. These methods are helpers for procedures described in [Docs#Authentication](https://www.houndify.com/docs#authentication):

* *generateAuthHeaders(clientId, clientKey, userId, requestId, timestamp)* generates the headers for HTTP Text and Voice Requests. clientId and clientKey are required, while other headers are optional. **Note:** all fields here should be the same as in Request Info JSON;
* *signToken(token, clientKey)* generates signed token for Websocket Voice Requests. 



