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

    let con = { "connected": "true" };
    ws.send(JSON.stringify(con));

    var trackresultcb = function(response) {
      console.log(response);
      // ws.send(JSON.stringify(response));
    };
//    this.track('current', trackresultcb);
  });
}

musicService.prototype._handleEvents = function () {

  this.mopidy.on("event:playbackStateChanged", (response) => {
    console.log("New State: " + JSON.stringify(response));
    console.log("State is " + response.new_state);

    this.wss.clients.forEach(function each(client) {
      client.send(JSON.stringify(response));
    });
  });

  this.mopidy.on("event:trackPlaybackStarted", (response) => {
    let album = response.tl_track.track.album;
    let track = response.tl_track.track;

    console.log("Album: " + album.name + ", Album Artist(s): " + album.artists[0].name + ", Song: " + track.name);

    this.wss.clients.forEach(function each(client) {
      client.send(JSON.stringify(track));
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
    case 'stop':
      this.mopidy.playback.stop()
        .then( () => responsecb.status(200).json({ "message": "success" }))
        .catch( () => responsecb.status(400).json({ "error": "unknown" }))
        .done();
      break;      
    default:
      console.log("Missing playback action");
      responsecb.status(400).json({ "error": "no action specified" });
  }

}

musicService.prototype.playlists = function(responsecb) {

  console.log("Recieved Mopidy Request for playlists");

  this.mopidy.playlists.getPlaylists().then( (playlists) => {
    if (playlists) {
      responsecb.json(playlists);
    } else {
      responsecb.status(400).json({ "error": "no playlists available" });
    }
  })
  .catch( () => res.status(400).json({ "error": "unknown" }))
  .done();
}

musicService.prototype.load = function(playlisturi, responsecb) {
  // We're expecting a playlist URI vs a list of tracks

  console.log("Recieved Mopidy Request to Load playlist URI:: " + playlisturi);

  // Clear the current playlist, this could be made optional
  this.mopidy.tracklist.clear();

  // .add(tracks, position, uri)
  this.mopidy.tracklist.add(null, null, playlisturi)
    .then( () => responsecb.status(200).json({ "message": "success" }))
    .catch( () => responsecb.status(400).json({ "error": "unknown" }))
    .done();
}

musicService.prototype.track = function(type, responsecb) {
  // Accept current, next, prev as type

  console.log("Recieved Mopidy Request for " + type + " track");

  this.mopidy.playback.getCurrentTrack().then( (track) => {
    if (track) {
      responsecb.json(track);
    } else {
      responsecb.status(400).json({ "error": "no track available" });
    }
  })
  .catch( () => res.status(400).json({ "error": "unknown" }))
  .done();
}

module.exports.musicService = musicService;
