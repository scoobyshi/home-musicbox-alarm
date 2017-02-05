const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

// Attach Websocket endpoints for real-time events (eg play-pause, current song)
var Music = require('./lib/musicService');
var player = new Music.musicService(server, '/music/ws');

const routes = require('./router/api');

// Inflate the request with the websocket music player 
var addPlayer = function (req, res, next) {
  req.player = player;
  next();
}
app.use(addPlayer);

// Provide API endpoints to control playback
app.use('/music/api', routes);

/* No longer needed if we can pass via routes
app.get('/music/next', (req, res) => {
  console.log("Received Next Song API Request");
  player.nextSong(res);  
}); */

server.listen(5001, () => {
  console.log("Listening on port: ", server.address().port);
});
