const routes = require('express').Router();

routes.post('/test', (req, res) => {
  req.player.nextSong(res);

//  res.status(200).json({ message: 'Connected to Next!' });
});

module.exports = routes;
