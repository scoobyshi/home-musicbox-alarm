var rp = require('request-promise');
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:5001/music/ws');
const uri = 'http://localhost:5001';

ws.on('open', () => {
  ws.send('We are Connected');
  setTimeout(() => ws.send('Just checking you are still there'),5000);

/* Route no longer available 
  setTimeout(() => {
    var options = {
      method: 'GET',
      uri: uri + '/music/next',
      json: true
    }

    rp(options)
    .then( (response) => {
      console.log("Recieved response");
      console.log(response.message);
    })
    .catch( (error) => {
      console.log("Errors");
    });
  },15000); */

  setTimeout(() => {
    var options = {
      method: 'POST',
      uri: uri + '/music/api/control/next',
      json: true
    }

    rp(options)
    .then( (response) => {
      console.log("Recieved response");
      console.log(response.message);
    })
    .catch( (error) => {
      console.log("Errors");
    });
  },10000);
});

// Incoming Messages type 'message'
ws.on('message', (data,flags) => {
  console.log(data);
});

ws.on('close', () => {
  console.log("Connection closed");
});

