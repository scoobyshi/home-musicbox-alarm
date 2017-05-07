const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const routes = require('./router/api');

// Register service
const etcclient = require('./lib/etcd');
etcclient.setServiceKey();

// Attach Websocket endpoints for real-time events (eg play-pause, current song)
var Music = require('./lib/musicService');
var player = new Music.musicService(server, '/music/ws');

// Setup Prometheus monitoring
var prom = require('prom-client');
var collectDefaultMetrics = prom.collectDefaultMetrics;
collectDefaultMetrics(5000);

// Export Prometheus metrics from /metrics endpoint
app.get('/metrics', function(req, res) {
  res.end(prom.register.metrics());
});

// Temporarily enable CORS for Dev only
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Inflate the request with the websocket music player
var addPlayer = function (req, res, next) {
  req.player = player;
  next();
}
app.use(addPlayer);

// Provide API endpoints to control playback
app.use('/music/api', routes);

// Setup Server, Bind Port
server.listen(5001, () => {
  console.log("Listening on port: ", server.address().port);
});
