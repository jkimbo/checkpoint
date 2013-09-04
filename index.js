// vim: set shiftwidth=2

var twitter = require('ntwitter'),
    Q = require('q'),
    Socket = require('./socket'),
    nStore = require('nstore');

nStore = nStore.extend(require('nstore/query')());

var config = require('./config');

var twit = new twitter(config.twitter);

var socket = new Socket();

// Create a db
var q = Q.defer();
var tweets = nStore.new('data/tweets.db', function () {
  q.resolve();
});

q.promise.then(function() {

  // Load all favourite tweets
  twit.get('/favorites/list.json', function(err, data) {
    var promises = [];

    if(err) throw err;

    data.forEach(function(tweet) {
      var defer = Q.defer();
      promises.push(defer.promise);
      tweets.find({ id: tweet.id }, function(err, result) {
        if(err) throw err;
        if (result.length === 0) {
          tweets.save(null, tweet, function(err, key) {
            // Check if the tweet has been saved already
            if (err) {
              defer.reject(err);
            } else {
              defer.resolve(key);
            }
          });
        } else {
          for(var key in result) {
            defer.resolve(key);
            break;
          }
        }
      });
    });

    // Wait for all tweets to be saved
    var saved = Q.all(promises);

    // All tweets have been saved
    saved.then(function() {
      console.log('all tweets saved!');

      // Start socket.io
      console.log('Starting socket.io');
      socket.initialize(config.port, data);

      // Start listening to the streaming api
      twit.stream('user', function(stream) {
        console.log('connected to stream');
        stream.on('data', function (data) {
          if (data.event == 'favorite') {
            socket.broadcast(data.target_object);
          } else if (data.event == 'unfavorite') {
            socket.redact(data.target_object);
          }
        });
        stream.on('end', function (response) {
          // Handle a disconnection
          console.log('Ended');
        });
        stream.on('destroy', function (response) {
          // Handle a 'silent' disconnection from Twitter, no end/error event fired
          console.log('destroyed');
        });
      }).then(null, function(err) {
        throw err;
      });
    }).then(null, function(err) {
      throw err;
    });
  });
});

