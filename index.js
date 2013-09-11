// vim: set shiftwidth=2

var twitter = require('ntwitter'),
    Q = require('q'),
    Socket = require('./socket');

var config = require('./config');

var twit = new twitter(config.twitter);

var socket = new Socket();

console.log('Loading previous tweets...');
// Load all favourite tweets
twit.get('/favorites/list.json', function(err, data) {
  if(err) throw err;

  console.log('Got past '+data.length+' tweets');

  // Start socket.io
  console.log('Starting socket.io on port ' + config.port);
  socket.initialize(
    config.port || 8888,
    data,
    null,
    config.channel || null
  );

  // Start listening to the streaming api
  twit.stream('user', function(stream) {
    console.log('Connected to Twitter stream');
    stream.on('data', function (data) {
      if (data.event == 'favorite') {
        socket.broadcast(data.target_object);
      } else if (data.event == 'unfavorite') {
        socket.redact(data.target_object);
      }
    });
    stream.on('end', function (response) {
      // Handle a disconnection
      console.log('Twitter stream ended');
    });
    stream.on('destroy', function (response) {
      // Handle a 'silent' disconnection from Twitter, no end/error event fired
      console.log('Twitter stream destroyed');
    });
  });
});

