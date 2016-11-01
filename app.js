var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var mongojs = require('mongojs')
// var db = mongojs('cloudcontrolDB', ['users', 'devices', 'handshake'])
var db = mongojs('thanhtam4692:thanhtam4692@ds013848.mlab.com:13848/sidneysservices', ['bannersdata'])

var Flickr = require("node-flickr");
var keys = {"api_key": "6a3312c8a63160eb8762ec0275079f5f"}
flickr = new Flickr(keys);


var routes = require('./routes/index');
var users = require('./routes/users');
var portfolio = require('./routes/portfolio');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);
app.use('/portfolio', portfolio);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error.ejs', {
      title: "Error page",
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error.ejs', {
    title: "Error page",
    message: err.message,
    error: {}
  });
});


module.exports = app;
