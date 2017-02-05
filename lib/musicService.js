const WebSocket = require('ws');

// Should have musicService which creates server and on success returns result, as promise?
// Then musicService.prototype.listen which has all the events? call this after Main service returns success?
// Finally can call musicService.prototype.nextSong from API request?

function musicService(server, path) {
  this.wss = new WebSocket.Server({ server: server, path: path });

  var Mopidy = require('mopidy');
  this.mopidy = new Mopidy({
    webSocketUrl: "ws://localhost:6680/mopidy/ws/"
  });

  // Log all activity and interaction with Mopidy to console
  // mopidy.on(console.log.bind(console));

  this.mopidy.on("state:online", () => {
    console.log("Music Service is Online");
    this._handleEvents();
  });

  this.wss.on('connection', (ws) => {
    ws.on('message', (message) => {
      console.log('received: %s', message);
    });
 
    ws.send('You Connected');
  });
}

musicService.prototype._handleEvents = function () {

  this.mopidy.on("event:playbackStateChanged", (response) => {
    console.log("New State: " + JSON.stringify(response));
    console.log("State is " + response.new_state);

    this.wss.clients.forEach(function each(client) {
      client.send("State Changed to: " + response.new_state);
    });
  });

  this.mopidy.on("event:trackPlaybackStarted", (response) => {
    var track = response.tl_track.track.album;
    console.log("New Song: " + track.name + " Artist: " + track.artists[0].name);

    this.wss.clients.forEach(function each(client) {
      client.send("New Song is Playing: " + track.name);
    });
  });
}

musicService.prototype.playback = function(action, responsecb) {

  console.log("Recieved Mopidy Request for playback change: " + action);
  
  // Most of these actions are missing a response in the promise from Mopidy
  switch (action) {
    case 'play':
      this.mopidy.playback.play()
        .then( () => responsecb.status(200).json({ "message": "success" }))
        .catch( () => responsecb.status(400).json({ "error": "unknown" }))
        .done();
      break;
    case 'next':
      this.mopidy.playback.next()
        .then( () => responsecb.status(200).json({ "message": "success" }))
        .catch( () => responsecb.status(400).json({ "error": "unknown" }))
        .done();
      break;
    default:
      console.log("Missing playback action");
      responsecb.status(400).json({ "error": "no action specified" });
  }

}

module.exports.musicService = musicService;
