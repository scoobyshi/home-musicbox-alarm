const routes = require('express').Router();

// Playback controls
routes.post('/control/:action', (req, res) => {
  let action = req.params.action;
  let playcontrol = req.player;

  console.log("Requested Playback API Action:", action);

  playcontrol.playback(action, res);
});

// Retrieve playlists
routes.get('/playlists', (req, res) => {
  let playcontrol = req.player;

  console.log("Requested All Playlists API");

  playcontrol.playlists(res);
});

// Load playlist
routes.post('/load', (req, res) => {
  let playlistid = req.query.playlistid;
  let playcontrol = req.player;

  console.log("Requested Loading API for Playlist ID:", playlistid);

  playcontrol.load(playlistid, res);
});

routes.get('/schedule', (req, res) => {
  // Expecting playing, stopping
  let playcontrol = req.player;

  console.log("Requested Alarm Schedule.");

  playcontrol.showSchedule(res);
});

// Update schedule
routes.post('/schedule', (req, res) => {
  let playlistid = req.query.playlistid;
  let cron = req.query.cron;
  let playcontrol = req.player;

  console.log("Requested Update to Schedule with Playlist ID:", playlistid);

  playcontrol.updateSchedule(playlistid, cron, res);
});

// Get current playback state
routes.get('/state', (req, res) => {
  // Expecting playing, stopping
  let playcontrol = req.player;

  console.log("Requested Playback State.");

  playcontrol.state(res);
});

// Get current track
routes.get('/track/:type', (req, res) => {
  // Expecting current, next, prev
  let type = req.params.type || '';
  let playcontrol = req.player;

  console.log("Requested Track that is: " + type);

  playcontrol.track(type, res);
});

module.exports = routes;
