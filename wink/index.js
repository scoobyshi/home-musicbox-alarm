var wink = require('wink-js');

wink.init({
    conf: "config.json"
}, function(auth_return) {
    if ( auth_return === undefined ) {
	console.log("There was an Auth error");
        // error
    } else {
        // success
        wink.user().device('Living Room Light', function(device) {
            device.power.off(function(response) {
                if (response === undefined) {
                    // error
		    console.log("Issue with Living Room light");
                } else {
		    console.log("Turned off Living Room light");
                    // success
                }
            });
        });
    }
});
