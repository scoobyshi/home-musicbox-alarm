var rp = require('request-promise');
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:5001/music/ws');
const uri = 'http://localhost:5001';

ws.on('open', () => {
  ws.send('We are Connected');
  setTimeout(() => ws.send('Just checking you are still there'),5000);

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
  console.log(JSON.parse(data));

  // Should test if this is JSON
  let result = JSON.parse(data);

  if (result.album) {
    console.log("There is a New Song: " + result.name); 
  } else if (result.new_state) {
    console.log("State Changed: " + result.new_state);
  }
});

ws.on('close', () => {
  console.log("Connection closed");
});

