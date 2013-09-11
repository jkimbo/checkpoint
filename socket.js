/**
 * Set up socket.io server
 */
var socket = require('socket.io');
var _ = require('lodash');

var Socket = function() {
  this.maxBufSize = 20;
};

/**
 * Start socket
 *
 * port - port to listen to
 * buffer - array of data to buffer
 * cb - callback function to run after connection is established with a socket
 * channel - channel to broadcast data over [defaults to 'event']
 */
Socket.prototype.initialize = function(port, buffer, cb, channel) {
  this.io = socket.listen(port);
  this.buffer = buffer;

  this.io.set('log level', 1);

  if (typeof channel === 'undefined' || channel === null) {
    this.channel = 'event';
  } else this.channel = channel;

  this.io.sockets.on('connection', _.bind(function(socket) {
    this.io.sockets.emit(this.channel, this.buffer);

    if (typeof cb === 'function') {
      cb(socket);
    }
  }, this));
};

/**
 * Broadcast data
 *
 * data - data to send
 */
Socket.prototype.broadcast = function(data) {
  if (data instanceof Array) {
    _.union(this.buffer, data); // add data to buffer
  } else {
    this.buffer.push(data); // add data to buffer
  }
  this.limitBuffer();
  this.io.sockets.emit(this.channel, data);
};

/**
 * Redact data
 *
 * data - data to send
 */
Socket.prototype.redact = function(data) {
  this.buffer = _.filter(this.buffer, function(obj) {
    if (data.id === obj.id) {
      return false;
    }
    return true;
  });

  this.io.sockets.emit(this.channel, {redact: true, data: data});
};

/**
 * Limit buffer
 * Reduce size of buffer till it is within the maxBufSize
 */
Socket.prototype.limitBuffer = function() {
  if (this.buffer.length > this.maxBufSize) {
    var diff = this.buffer.length - this.maxBufSize;
    for (var i = 0; i < diff; i++) {
      this.buffer.splice(0, 1);
    }
  }
};

module.exports = Socket;
