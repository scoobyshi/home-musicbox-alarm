const WebSocket = require('ws');
var scheduler = require('./musicServiceSchedule');
var handleEvents = require('./musicServiceEvents');

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
    this._scheduleEvents();
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

// Setup and Schedule "Alarm" Cron events
musicService.prototype._scheduleEvents = scheduler.autoSchedule;

// Show scheduler detail
musicService.prototype.showSchedule = scheduler.showSchedule;

// Update the scheduler
musicService.prototype.updateSchedule = scheduler.updateSchedule;

// Handle and Emit to Clients certain WebSocket Events
musicService.prototype._handleEvents = handleEvents.eventEmitter;

musicService.prototype._sendResponse = function(code, cbFunc) {
  if (typeof cbFunc.status === 'function') {
    if (code === 200) {
      cbFunc.status(200).json({ "message": "new success" });
    } else if (code === 400) {
      cbFunc.status(400).json({ "error": "no action specified" });
    } else {
      cbFunc.status(500).json({ "error": "unknown" });
    }
  } else {
    if (code === 200) {
      cbFunc("Success");
    } else {
      cbFunc("Failed");
    }
  }
}

musicService.prototype.state = function(responsecb) {
  this.mopidy.playback.getState()
    .then( (state) => {
      responsecb.status(200).json({ "state": state });
    })
    .catch( () => this._sendResponse(500, responsecb))
    .done();
}

musicService.prototype.playback = function(action, responsecb) {

  console.log("Recieved Mopidy Request for playback change: " + action);

  // Most of these actions are missing a response in the promise from Mopidy
  switch (action) {
    case 'play':
      this.mopidy.playback.play()
        .then( () => this._sendResponse(200, responsecb))
        .catch( () => this._sendResponse(500, responsecb))
        .done();
      break;
    case 'next':
      this.mopidy.playback.next()
        .then( () => this._sendResponse(200, responsecb))
        .catch( () => this._sendResponse(500, responsecb))
        .done();
      break;
    case 'prev':
      this.mopidy.playback.prev()
        .then( () => this._sendResponse(200, responsecb))
        .catch( () => this._sendResponse(500, responsecb))
        .done();
      break;
    case 'stop':
      this.mopidy.playback.stop()
        .then( () => this._sendResponse(200, responsecb))
        .catch( () => this._sendResponse(500, responsecb))
        .done();
      break;
    case 'pause':
      this.mopidy.playback.pause()
        .then( () => this._sendResponse(200, responsecb))
        .catch( () => this._sendResponse(500, responsecb))
        .done();
      break;
    default:
      console.log("Missing playback action");
      this._sendResponse(400, responsecb);
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
  .catch( () => res.status(500).json({ "error": "unknown" }))
  .done();
}

musicService.prototype.load = function(playlisturi, responsecb) {
  // We're expecting a playlist URI vs a list of tracks

  console.log("Recieved Mopidy Request to Load playlist URI:: " + playlisturi);

  // Clear the current playlist, this could be made optional
  this.mopidy.tracklist.clear();

  // .add(tracks, position, uri)
  this.mopidy.tracklist.add(null, null, playlisturi)
    .then( () => this._sendResponse(200, responsecb))
    .catch( () => this._sendResponse(500, responsecb))
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
  .catch( () => res.status(500).json({ "error": "unknown" }))
  .done();
}

module.exports.musicService = musicService;
