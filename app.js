const RCON = require("./lib/RCON");
var client = new RCON({host: '127.0.0.1', port: 6666, password: 'panino'});

client.init()
  .then(success => {

    client.sendCommand("time set 0")

})
