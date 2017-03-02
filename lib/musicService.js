const WebSocket = require('ws');
var schedule = require('node-schedule');
var sqlite3 = require('sqlite3'); // Add .verbose for more info
var db = new sqlite3.Database('./db/schedule.sqlite3');

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

musicService.prototype._scheduleEvents = function () {
  var scheduleDetail = [];
  var i = 0;
  // db.get('SELECT * FROM playschedule WHERE id = ?', req.params.id);
  db.all("SELECT id, playlistid, cron FROM playschedule", (err, rows) => {
    rows.forEach(function (row) {
      console.log(row.id, row.playlistid, row.cron);
      scheduleDetail[i] = row;
      i++;
    });

    // myScheduleDate = new Date(scheduleDetail[0].startdatetime);
    myScheduleCron = scheduleDetail[0].cron;
    myPlaylist = scheduleDetail[0].playlistid;
    // console.log("Date from DB: ", myScheduleDate, "Testing Local:", myScheduleDate.toLocaleString());
    console.log("Schedule Cron:", myScheduleCron);

    schedule.scheduleJob(myScheduleCron, () => {
      // Clear the current playlist
      this.load(myPlaylist, res => console.log("Response:", res));
      // Finally play
      this.playback('play', res => console.log("Response:", res));
    });

  });

  db.close();

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
    case 'stop':
      this.mopidy.playback.stop()
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
