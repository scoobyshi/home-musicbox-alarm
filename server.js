const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const routes = require('./router/api');

// Attach Websocket endpoints for real-time events (eg play-pause, current song)
var Music = require('./lib/musicService');
var player = new Music.musicService(server, '/music/ws');

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

server.listen(5001, () => {
  console.log("Listening on port: ", server.address().port);
});
