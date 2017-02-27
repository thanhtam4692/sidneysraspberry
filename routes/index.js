var express = require('express');
var router = express.Router();
var session = require('express-session');
var request = require('request');
var mongojs = require('mongojs')
var sidneyspi = mongojs('sidneyspi', ['homeon','users'])
var util = require('util');
var PythonShell = require('python-shell');
var async = require('async');
var fs = require('fs');

var io = require('socket.io-client');
var connecting_host = 'http://192.168.2.82:4000';
var username = "sidneyshome";
var token = '';

var login = require("facebook-chat-api");
var tamthanhtran_id = '';
var facebook_bot_is_working = false;
var fb_api;
var stopListening;

sidneyspi.users.findOne({
    "username": username
}, function(err, doc) {
  if (err) {
    console.log(err);
  }
  if (doc){
    tamthanhtran_id = doc.fbid
    setInterval(function(){
      if (!facebook_bot_is_working){
        facebook_bot_is_working = true;
        facebook_bot();
        console.log("Retry FB listening");
      }
    }, 10);
  }
  if (doc.token == '' || doc.token == null){
    request.post({
      url: connecting_host + '/users/login_application', form: {"username" : username, "password" : doc.password}
    }, function(err, httpResponse, body){
      body = JSON.parse(body);
      token = body.token;
      sidneyspi.users.update({
  			"username": username
  		  }, {
  				$set: {
  					"token": body.token
  			}
      });
      connect_io();
    })
  } else {
    token = doc.token;
    connect_io();
  }
})

function connect_io(){
  var socket = io.connect(connecting_host, {
    reconnect: true,
    query: 'token=' + token
  });

  // Add a connect listener
  socket.on('connect', function (msg) {
    console.log('Connected to Cloud');
    socket.emit('home_connecting_status', {'msg': 'sidney\'s home connected'});
  });

  socket.on('get_home_connecting_status', function (msg) {
    console.log('Send connecting status');
    socket.emit('home_connecting_status', {'msg': 'sidney\'s home connected'});
  });

  socket.on('get_home_accesories_status', function (msg) {
    sidneyspi.homeon.find({}, function(err, accessories){
      console.log('Send accessories status');
      socket.emit('home_accesories_status', {'msg': accessories});
    })
  });

  socket.on('reset_fb', function (msg) {
    stopListening
    socket.emit('home_accesories_status', {'msg': accessories});
  });

  socket.on('disconnect', function (msg) {
    console.log('Disconnected to Cloud');
  });
}

var dictionary_start = ["on", "start", "run", "operate", "go", "begin", "work"];
var dictionary_stop = ["off", "stop", "end", "suspend", "halt"]
var dictionary_mode = ["mode", "change", "switch"]
var dictionary_mode_auto = ["auto", "by yourself", "up to you", "not manual"]
var dictionary_mode_manual = ["manual", "by hand", "not auto"]
var dictionary_status = ["list", "status", "current", "state", "states"]

// Create simple anwering bot
function facebook_bot(){
  login({email: "tamtt4692.dev@gmail.com", password: "Xitrum4692"}, function callback (err, api) {
      if(err){
        console.log("FB logging in is not working");
        facebook_bot_is_working = false;
        return console.error(err);
      }
      console.log("FB bot is working...");
      fb_api = api;

      stopListening = api.listen(function callback(err, message) {
        if (err) {
          facebook_bot_is_working = false;
          console.log("Fb bot gets killed");
          return stopListening();
        }
        facebook_bot_is_working = true;

        // Check if user is verified
        if (message.threadID != tamthanhtran_id){
          var msg = "Sorry, you're not Tam. I can't talk to you in any circumstance."
          console.log("Talking to (not you): " + message.threadID);
          api.sendMessage(msg, message.threadID);
        } else {
          console.log("Talking to: " + tamthanhtran_id);
          var command = message.body.toLowerCase().split(' ')
          if (command[0] == "h"){
            if (command.length == 1 || (command.length >= 2 && (command[1] == "status" || command[1] == "devices" || command[1] == "device"))){
              sidneyspi.homeon.find({}, function(err, docs) {
                if (err) {
                  api.sendMessage(err, tamthanhtran_id);
                }
                if (docs.length == 0){
                  api.sendMessage("No devices", tamthanhtran_id);
                } else {
                  for (var i = 0; i < docs.length; i++) {
                    var msg = docs[i].alias + " is " + docs[i].status.power + ". Mode: " + docs[i].mode;
                    api.sendMessage(msg, tamthanhtran_id);
                  }
                }
              })
            } else {
              // Looking for all of the devices that matches
              var devices = [];
              async.each(command, function(comm, callback) {
                sidneyspi.homeon.find({
                    "keyword": comm
                  }, function(err, results){
                  if (err){
                    api.sendMessage(err, tamthanhtran_id);
                  }
                  devices.push(...results);
                  callback()
                })
              }, function(err) {
                  // if any of the file processing produced an error, err would equal that error
                  if( err ) {
                    // One of the iterations produced an error.
                    // All processing will now stop.
                    console.log('A command failed to process');
                  } else {
                    console.log("Number of devices found: " + devices.length);
                    exec_command(command, devices, api, tamthanhtran_id);
                  }
              });
            }
          } else {
            var msg = "Not a valid command. Please try again!"
            api.sendMessage(msg, tamthanhtran_id);
          }
        }
      });
  });
}

function exec_command(command, devices, api, tamthanhtran_id){
  var cmd_executed = false;
  async.each(command, function(comm, grandcallback){
    async.series([
      function(seriescallback) {
        // Check dictionary for keyword of viewing status
        if (check_dictionary(comm, dictionary_status)){
          async.each(devices, function(device, callback){
            var msg = device.alias + " is " + device.status.power + ". Mode: " + device.mode + ". Status:";
            var statuskeys = [];
            for (var k in device.status) {
              msg = msg + " " + k + " = " + device.status[k] + ",";
            }
            api.sendMessage(msg, tamthanhtran_id);
            callback()
          }, function(err){
            // if any of the file processing produced an error, err would equal that error
            if( err ) {
              // One of the iterations produced an error.
              // All processing will now stop.
              console.log('A command failed to process');
              var msg = "Error: " + err;
              api.sendMessage(msg, tamthanhtran_id);
              seriescallback(null, 'status');
            } else {
              console.log("Commands execution succeeded");
              cmd_executed = true;
              seriescallback(null, 'status');
            }
          })
        } else {
          seriescallback(null, 'status');
        }
      },
      function(seriescallback) {
        // Check dictionary for keyword of power on
        if (check_dictionary(comm, dictionary_start)){
          async.each(devices, function(device, callback){
            PythonShell.run('./python/' + device.name + '_on.py', function (err) {
              if (err) {
                console.log(err);
                var msg = "Error: " + err;
                // api.sendMessage(msg, tamthanhtran_id);
                console.log(msg);
              } else {
                console.log(device.alias + ' is on');
                var msg = device.alias + ' is on'
                api.sendMessage(msg, tamthanhtran_id);
              }
              callback()
            });
          }, function(err){
            // if any of the file processing produced an error, err would equal that error
            if( err ) {
              // One of the iterations produced an error.
              // All processing will now stop.
              console.log('A command failed to process');
              var msg = "Error: " + err;
              api.sendMessage(msg, tamthanhtran_id);
              seriescallback(null, 'on');
            } else {
              console.log("Commands execution succeeded");
              cmd_executed = true;
              seriescallback(null, 'on');
            }
          })
        } else {
          seriescallback(null, 'on');
        }
      },
      function(seriescallback) {
        // Check dictionary for keyword of power off
        if (check_dictionary(comm, dictionary_stop)){
          async.each(devices, function(device, callback){
            PythonShell.run('./python/' + device.name + '_off.py', function (err) {
              if (err) {
                console.log(err);
                var msg = "Error: " + err;
                // api.sendMessage(msg, tamthanhtran_id);
                console.log(msg);
              } else {
                console.log(device.alias + ' is off');
                var msg = device.alias + ' is off';
                api.sendMessage(msg, tamthanhtran_id);
              }
              callback()
            });
          }, function(err){
            // if any of the file processing produced an error, err would equal that error
            if( err ) {
              // One of the iterations produced an error.
              // All processing will now stop.
              console.log('A command failed to process');
              var msg = "Error: " + err;
              api.sendMessage(msg, tamthanhtran_id);
              seriescallback(null, 'off');
            } else {
              console.log("Commands execution succeeded");
              cmd_executed = true;
              seriescallback(null, 'off');
            }
          })
        } else {
          seriescallback(null, 'off');
        }
      },
      function(seriescallback) {
        // Check dictionary for keyword of change mode
        if (check_dictionary(comm, dictionary_mode)){
          // For each device
          async.each(devices, function(device, callback){
            // Run through each command
            async.each(command, function(cm, callback2){
              // Run synchronously
              async.series([
                function(callback3){
                  // Check whether to turn mode on
                  if (check_dictionary(cm, dictionary_mode_auto)){
                    PythonShell.run('./python/' + device.name + '_mode_auto.py', function (err) {
                      if (err) {
                        console.log(err);
                        var msg = "Error: " + err;
                        // api.sendMessage(msg, tamthanhtran_id);
                        console.log(msg);
                      } else {
                        console.log(device.alias + ' is auto');
                        var msg = device.alias + ' is auto';
                        api.sendMessage(msg, tamthanhtran_id);
                      }
                      cmd_executed = true;
                      callback3(null, "")
                    });
                  } else {
                    callback3(null, "")
                  }
                },
                function(callback3){
                  // Check whether to turn mode off
                  if (check_dictionary(cm, dictionary_mode_manual)){
                    PythonShell.run('./python/' + device.name + '_mode_manual.py', function (err) {
                      if (err) {
                        console.log(err);
                        var msg = "Error: " + err;
                        // api.sendMessage(msg, tamthanhtran_id);
                        console.log(msg);
                      } else {
                        console.log(device.alias + ' is manual');
                        var msg = device.alias + ' is manual';
                        api.sendMessage(msg, tamthanhtran_id);
                      }
                      cmd_executed = true;
                      callback3(null, "")
                    });
                  } else {
                    callback3(null, "")
                  }
                }
              ],
              function(err, result){
                callback2()
              })
            }, function(err){
                  // if any of the file processing produced an error, err would equal that error
                  if( err ) {
                    // One of the iterations produced an error.
                    // All processing will now stop.
                    console.log('A command failed to process');
                    var msg = "Error: " + err;
                    api.sendMessage(msg, tamthanhtran_id);
                  } else {
                    // console.log("commands execution succeeded");
                  }
                  callback()
            })
          }, function(err){
            // if any of the file processing produced an error, err would equal that error
            if( err ) {
              // One of the iterations produced an error.
              // All processing will now stop.
              console.log('A command failed to process');
              var msg = "Error: " + err;
              api.sendMessage(msg, tamthanhtran_id);
            } else {
              seriescallback(null, 'mode');
            }
          })
        } else {
          seriescallback(null, 'mode');
        }
      }
    ],
    function(err, results) {
      // results is now equal to ['one', 'two']
      grandcallback()
    })
  }, function(err){
    // if any of the file processing produced an error, err would equal that error
    if( err ) {
      // One of the iterations produced an error.
      // All processing will now stop.
      console.log('A command failed to process');
      var msg = "Error: " + err;
      api.sendMessage(msg, tamthanhtran_id);
    } else {
      // Finally, if cmd_executed is false, meaning that no cmd has been executed, the return a warning to the user
      if (!cmd_executed){
        var msg = "Nothing has been done. Please try again with some more specific queries/orders. For example: turn light on, turn fan off, see camera status... Thank you and have a nice day.";
        api.sendMessage(msg, tamthanhtran_id);
      }
      console.log("Bot responsed");
    }
  })
}
function check_dictionary(keyword, dics){
  for (var i = 0; i < dics.length; i++) {
    if (keyword == dics[i]){
      console.log("Check dictionary: found");
      return true
    }
  }
  console.log("Check dictionary: no found");
  return false
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index/index.ejs', { title: '' });
});

router.get('/CV-pdf', function(req, res, next) {
  res.redirect("https://s3-us-west-2.amazonaws.com/sidneysservices/personaldocuments/TamTran-CV.pdf");
});

router.post('/banners', function(req, res, next) {
  var sess = req.session
  if (!sess.lastBanner) {
    sess.lastBanner = -1
  }
  var photosetid = "72157675216072834";
  var userId = "62042974@N04";
  flickr.get("photosets.getPhotos", {"photoset_id": photosetid, "user_id": userId}, function(errGetPhotos, result){
      if (errGetPhotos || result == "undefined") {
        console.log(errGetPhotos);
        if (errGetPhotos.code == 2) {
          flickr.get("urls.lookupUser", {"url": "https://www.flickr.com/photos/thanhtam4692/albums/72157664159506139"}, function(errUser, resultUser){
            if (errUser || resultUser == "undefined") {
              console.log(errUser);
              res.send({ url: '0', error: "01", errorMessage: errUser});
            }
            flickr.get("photosets.getPhotos", {"photoset_id": photosetid, "user_id": resultUser.user.id}, function(errGetPhotosWithRealUserId, resultPhotoset){
              if (errGetPhotosWithRealUserId || resultPhotoset == "undefined") {
                console.log(errGetPhotosWithRealUserId);
                res.send({ url: '0', error: "01", errorMessage: errGetPhotosWithRealUserId});
              } else {
                var numberOfPhotos = resultPhotoset.photoset.photo.length;
                var randomNumber = Math.floor((Math.random() * numberOfPhotos) + 1);
                while (randomNumber === sess.lastBanner) {
                  numberOfPhotos = resultPhotoset.photoset.photo.length;
                  randomNumber = Math.floor((Math.random() * numberOfPhotos) + 1);
                }
                sess.lastBanner = randomNumber;

                flickr.get("photos.getSizes", {"photo_id": result.photoset.photo[randomNumber % numberOfPhotos].id}, function(errSize, resultSizes){
                  if (errSize || resultSizes == "undefined") {
                    console.log(errSize);
                    res.send({ url: '0', error: "01", errorMessage: errSize});
                  } else {
                    var pUrl = resultSizes.sizes.size[resultSizes.sizes.size.length - 1].source;
                    res.send({ url: pUrl, error: "0" });
                  }
                });
              }
            });
          });
        } else {
          res.send({ url: '0', error: "01", errorMessage: errGetPhotos});
        }
      } else {
        var numberOfPhotos = result.photoset.photo.length;
        var randomNumber = Math.floor((Math.random() * numberOfPhotos) + 1);
        while (randomNumber === sess.lastBanner) {
          numberOfPhotos = result.photoset.photo.length;
          randomNumber = Math.floor((Math.random() * numberOfPhotos) + 1);
        }
        sess.lastBanner = randomNumber;

        flickr.get("photos.getSizes", {"photo_id": result.photoset.photo[randomNumber % numberOfPhotos].id}, function(errSize, resultSizes){
          if (errSize || resultSizes == "undefined") {
            console.log(errSize);
            res.send({ url: '0', error: "01", errorMessage: errSize});
          } else {
            var pUrl = resultSizes.sizes.size[resultSizes.sizes.size.length - 1].source;
            res.send({ url: pUrl, error: "0" });
          }
        });
      }
    });
});

// Get page About
router.get('/about', function(req, res, next) {
  res.render('index/index.ejs', { title: 'about' });
});
router.post('/about', function(req, res, next) {
  res.render('about/about.ejs', { title: 'about' });
});

// Get page Activities
router.get('/activities', function(req, res, next) {
  res.render('index/index.ejs', { title: 'activities' });
});
router.post('/activities', function(req, res, next) {
  res.render('activities/activities.ejs', { title: 'activities' });
});

// Get page Contact
router.get('/contact', function(req, res, next) {
  res.render('index/index.ejs', { title: 'contact' });
});
router.post('/contact', function(req, res, next) {
  res.render('contact/contact.ejs', { title: 'contact' });
});

// Get page wakeitup
router.get('/wakeitup', function(req, res, next) {
  res.render('general/wake.ejs', { title: 'It is on' });
});

// Get page flickrdownloader
router.get('/flickrdownloader', function(req, res, next) {
  res.render('index/index.ejs', { title: 'SocketIO' });
});

// SocketIO demo
router.get('/socketio', function(req, res, next) {
  res.render('general/socketio.ejs', { title: 'Thanh Tam Tran' });
});

// Receive and send notification
router.get('/noti', function(req, res, next) {
  var event_trigger = "unusual_motion_noti";
  request.post({url:'https://maker.ifttt.com/trigger/' + event_trigger + '/with/key/bceACWINhDS749idRVaBHI', form: {"value1" : "testing", "value2" : "home", "value3" : "unusual_motion_noti"}}, function(err,httpResponse,body){
   console.log("nearby_noti's sent");
   res.send(body);
  })
});

router.post('/fb_notify', function(req, res, next) {
  var photo = req.body.photo;
  var dirname = "./motion/motionimages/"
  console.log("Serving file: " + dirname + photo);
  if (fs.existsSync(dirname + photo)){
    var msg = {
        body: "Motion alert!",
        attachment: fs.createReadStream(dirname + photo)
      }
  } else {
    console.log("File not found!");
    var msg = "Motion alert!";
  }
  fb_api.sendMessage(msg, tamthanhtran_id);
  res.send("FB alerting succeeded")
});


module.exports = router;
