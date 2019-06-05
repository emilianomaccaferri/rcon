// implementing as described in https://developer.valvesoftware.com/wiki/Source_RCON_Protocol

const net = require('net');

var RCON = function(obj){

  this.address = obj.host;
  this.port = obj.port;
  this.password = obj.password;
  this.client = net.Socket();
  this.commands = {};
  this.auth = true;

  this.sendCommand = function(command){

    if(!this.auth)
      throw new Error('The password you provided is invalid.');

    this.client.write(
      this.build(2, command, parseInt(Object.keys(this.commands)[Object.keys(this.commands).length - 1]) + 1)

      // the ID is given by the request_id of the latest command executed + 1

    )

  }

  this.init = function(){

    return new Promise(

      (resolve, reject) => {

        this.client.on('data', p => {

          // packet incoming!

          var res = [], yes = true;

          while(yes){

            var size = p.readInt32LE(0),
                id = p.readInt32LE(4),
                body = p.toString('utf-8', 12, 10 + p.readInt32LE(0));

            if(id == -1){

              this.auth = false;
              throw new Error('The password you provided is invalid.');
              break;

            }

            res.push({
              size, id, type: p.readInt32LE(8), body

            });

            this.commands[id].response = body

            if(p.size > size + 4) // if the packet contains more than one response
              p.slice(size + 4) // position to the next response
            else
              yes = false;

          }

          console.log(res);

        })

        // authenticates the client
        this.client.connect(this.port, this.address,  () => {

          this.client.write(
            this.build(3, this.password, 1), () => {

              resolve(true);

            }
          )

        })

      }

    )

  }

  this.build = function(packet_type, payload, request_id){

    var buffer = Buffer.alloc(14 + payload.length); // minimum buffer size is 10, then we add the length of the command we are sending
    buffer.writeInt32LE(10 + payload.length, 0); // minimum is 10, padded at 0 bytes from the start;
    buffer.writeInt32LE(request_id, 4); // int is 32-bit long so the padding is 4 bytes
    buffer.writeInt32LE(packet_type, 8);
    buffer.write(payload, 12); // finally writing the payload
    buffer.writeInt16LE(0, (12 + payload.length)); // two (16 bit) null bytes at the end of the packet

    // appending the command to our list of executed commands
    this.commands[request_id] = {payload, "response": ""};

    return buffer;

  }

}

module.exports = RCON;
