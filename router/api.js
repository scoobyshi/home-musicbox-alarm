const routes = require('express').Router();

// Playback controls
routes.post('/control/:action', (req, res) => {
  let action = req.params.action;
  let playcontrol = req.player;
 
  console.log("Requested Playback API Action:", action);

  playcontrol.playback(action, res);
});

module.exports = routes;
