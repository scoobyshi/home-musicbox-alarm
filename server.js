const express = require('express');
const app = express();
app.set('port', (process.env.PORT || 4001));

var Mopidy = require('mopidy');
var mopidy = new Mopidy({
  webSocketUrl: "ws://localhost:6680/mopidy/ws/"
});

// Log all activity and interaction with Mopidy to console
// mopidy.on(console.log.bind(console));

mopidy.on("state:online", () => {
  console.log("Music Service is Online");
});

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.post('/api/next', (req,res) => {
  console.log("Recieved API Request for Next Song");

  mopidy.playback.next().then( () => {
    res.status(200).json({ "message": "success" });
  })
  .catch( () => {
    res.status(400).json({ "error": "unknown" });
  })
  .done();
});

app.post('/api/load/:playlist_uri', (req,res) => {
  var playlist_uri = req.params.playlist_uri;
  console.log("Recieved API Request to Load and Play Tracks for ID: " + playlist_uri);

  // Clear the playlist, this could be an option
  mopidy.tracklist.clear();
  // .add(tracks, position, uri)
  mopidy.tracklist.add(null, null, playlist_uri).then( () => {
    if (req.query.action == "play") {
      mopidy.playback.play();
    } else if (req.query.action == "pause") {
      mopidy.playback.pause();
    }
    res.status(200).json({ "message": "success" });
  })
  .catch( () => {
    res.status(400).json({ "error": "unknown" });
  })
  .done();
});

app.get('/api/playlists', (req,res) => {
  console.log("Recieved API Request for Available Playlists");

  mopidy.playlists.getPlaylists().then( (playlists) => {
    if (playlists) {
      res.json(playlists);
    } else {
      res.status(400).json({ "error": "no playlists available" });
    }
  })
  .catch( () => {
    res.status(400).json({ "error": "unknown" });
  })
  .done();
});

app.get('/api/track', (req,res) => {
  console.log("Recieved API Request for Current Track");

  mopidy.playback.getCurrentTrack().then( (track) => {
    if (track) {
      res.json(track);
    } else {
      res.status(400).json({ "error": "no track available" });
    }
  })
  .catch( () => {
    res.status(400).json({ "error": "unknown" });
  })
  .done();
});

app.listen(app.get('port'), () => {
  console.log("Find the server at: localhost:" + app.get('port'));
});


