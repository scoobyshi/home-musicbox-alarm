function eventEmitter() {

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

    let uris = [ album.uri ];

    this.mopidy.library.getImages(uris).then( (image) => {

      // console.log(JSON.stringify(image));
      image[uris].forEach( (cover_art) => {
        // console.log(JSON.stringify(cover_art));
        if (cover_art.width === 300) {
          track.cover_art = cover_art;
        }
      })

    }).finally( () => {

      console.log("Album: " + album.name + ", Album Artist(s): " + album.artists[0].name + ", Song: " + track.name, " Art: " + track.cover_art.uri);
      this.wss.clients.forEach(function each(client) {
        client.send(JSON.stringify(track));
      });

    });
  });
}

module.exports.eventEmitter = eventEmitter;
