const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

var Music = require('./lib/musicService');
var player = new Music.musicService(server, '/music/ws');

var routes = require('./routes');
var addPlayer = function (req, res, next) {
  req.player = player;
  next();
} 
app.use(addPlayer);
app.use('/music/api', routes);

/* var restapi = require('./lib/serviceAPI');
app.get('/music/api', (req, res) =>  {
   restapi.service(req, res, player);
}); */

app.get('/music/next', (req, res) => {
  console.log("Received Next Song API Request");
  player.nextSong(res);  
});

server.listen(5001, () => {
  console.log("Listening on port: ", server.address().port);
});
