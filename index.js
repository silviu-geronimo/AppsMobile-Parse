// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var ParseDashboard = require('parse-dashboard');
var path = require('path');

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'myAppId',
  masterKey: process.env.MASTER_KEY || '', //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',  // Don't forget to change to https if needed
  liveQuery: {
    classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
  },
  push: {
    android: {
      senderId: process.env.ANDROID_SENDER_ID || '12345', // The Sender ID of GCM
      apiKey: process.env.ANDROID_API_KEY || 'andApiKey' // The Server API Key of GCM
    },
    ios: {
      pfx: 'certs/pushcert.p12', // the path and filename to the .p12 file you exported earlier.
      bundleId: process.env.BUNDLE_ID || 'bundleId', // The bundle identifier associated with your app
      production: false
    }
  }
});

var dashboard = new ParseDashboard({
  "apps": [
    {
      "serverURL": process.env.SERVER_URL || 'http://localhost:1337/parse',
      "appId": process.env.APP_ID || 'myAppId',
      "masterKey": process.env.MASTER_KEY || '',
      "appName": process.env.PARSE_APP_NAME
    }
  ],
  "users": [
    {
      "user": process.env.PARSE_DASHBOARD_USERNAME || "username",
      "pass": process.env.PARSE_DASHBOARD_PASSWORD || "password"
    }
  ]
},1);


// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the dashboard
app.use('/dashboard', dashboard);

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('Parse server');
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
});

var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server running on port ' + port + '.');
    console.log('parse-dashboard running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
