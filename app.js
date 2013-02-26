var express = require('express');
var redis = require('redis');
var client = exports.client  = redis.createClient();
var sio = require('socket.io');
var chat_object = require('./hc/models/chat.object.js');
var parseCookies = require('connect').utils.parseSignedCookies
, cookie = require('cookie')
, config = require('./hc/config/local.js')
, RedisStore = require('connect-redis')(express);

var sessionStore = exports.sessionStore = new RedisStore({client: client});

var server = express()
.use(express.vhost('localhost', require('./hc')))
.listen(8080,function(){
	 console.log("----------------AS READY----------------");
});

chat_object.removeAllRecord(client);

var io = sio.listen(server);
io.set('authorization', function (hsData, accept) {
  if(hsData.headers.cookie) {
    var cookies = parseCookies(cookie.parse(hsData.headers.cookie), config.session.secret)
      , sid = cookies['hatchcatch'];
    sessionStore.load(sid, function(err, session) {
      if(err || !session) {
        return accept('Error retrieving session!', false);
      }

      hsData.hatchcatch = {
        user: session.passport.user,
        room: /\/(?:([^\/]+?))\/?$/g.exec(hsData.headers.referer)[1]
      };

      return accept(null, true);
      
    });
  } else {
    return accept('No cookie transmitted.', false);
  }
});

io.configure(function() {
  io.set('store', new sio.RedisStore({client: client}));
  io.enable('browser client minification');
  io.enable('browser client gzip');
});

chat_object.initializeChat(client,io);