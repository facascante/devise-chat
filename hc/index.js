
/**
 * Module dependencies.
 */

var express = require('express')
  , router = require('./routes/autoload')
  , passport = require('passport')
  , path = require('path')
  , config = require('./config/local.js')
  , expressValidator = require('express-validator')
  , redis = require('redis')
  , RedisStore = require('connect-redis')(express);

require('./config/strategy');

var client = exports.client  = redis.createClient();
var sessionStore = exports.sessionStore = new RedisStore({client: client});

var app = module.exports = express();

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(expressValidator);
  app.use(config.local);
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session({
	    key: "hatchcatch",
	    store: sessionStore
	  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
app.use(express.errorHandler({showStack: true, dumpExceptions: true}));

});

app.get('/:version/login',router.login);
app.get('/:version/option',router.option);
app.post('/:version/chat',router.chat);
app.get('/:version/authfb', passport.authenticate('facebook'));
app.get('/:version/authtw', passport.authenticate('twitter'));
app.get('/:version/authfb/callback', 
	    passport.authenticate('facebook', {
	      successRedirect: '/v1/option',
	      failureRedirect: '/v1/login'
	    })
);
app.get('/:version/authtw/callback', 
	    passport.authenticate('twitter', {
	      successRedirect: '/v1/option',
	      failureRedirect: '/v1/login'
	    })
);

app.get('/:version/logout', function(req, res){
	  req.logout();
	  res.redirect('/:version/login');
});


