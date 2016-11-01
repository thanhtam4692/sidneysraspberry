var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index.ejs', { title: 'Homepage' });
});

router.post('/banners', function(req, res, next) {
  var photosetid = "72157664159506139";
  var userId = "thanhtam4692";
  flickr.get("photosets.getPhotos", {"photoset_id": photosetid, "user_id": userId}, function(errGetPhotos, result){
      if (errGetPhotos) {
        console.log(errGetPhotos);
        if (errGetPhotos.code == 2) {
          flickr.get("urls.lookupUser", {"url": "https://www.flickr.com/photos/thanhtam4692/albums/72157664159506139"}, function(errUser, resultUser){
            if (errUser) {
              console.log(errUser);
              res.send({ url: '0', error: "01", errorMessage: errUser});
            }
            flickr.get("photosets.getPhotos", {"photoset_id": photosetid, "user_id": resultUser.user.id}, function(errGetPhotosWithRealUserId, result){
              if (errGetPhotosWithRealUserId) {
                console.log(errGetPhotosWithRealUserId);
                res.send({ url: '0', error: "01", errorMessage: errGetPhotosWithRealUserId});
              } else {
                var numberOfPhotos = result.photoset.photo.length;
                var randomNumber = Math.floor((Math.random() * numberOfPhotos) + 1);

                flickr.get("photos.getSizes", {"photo_id": result.photoset.photo[randomNumber % numberOfPhotos].id}, function(errSize, resultSizes){
                  if (errSize) {
                    console.log(errSize);
                    res.send({ url: '0', error: "01", errorMessage: errSize});
                  }
                  var pUrl = resultSizes.sizes.size[resultSizes.sizes.size.length - 1].source;
                  res.send({ url: pUrl, error: "0" });
                });
              }
            });
          });
        } else {
          res.send({ url: '0', error: "01", errorMessage: errGetPhotos});
        }
      } else {
        flickr.get("photos.getSizes", {"photo_id": result.photoset.photo[2].id}, function(errSize, resultSizes){
          if (errSize) {
            console.log(errSize);
            res.send({ url: '0', error: "01", errorMessage: errSize});
          }
          var pUrl = resultSizes.sizes.size[resultSizes.sizes.size.length - 1].source;
          res.send({ url: pUrl, error: "0" });
        });
      }
    });
});

router.post('/about', function(req, res, next) {
  res.render('about.ejs', { title: 'About' });
});

router.post('/activities', function(req, res, next) {
  res.render('activities.ejs', { title: 'About' });
});

router.post('/contact', function(req, res, next) {
  res.render('contact.ejs', { title: 'About' });
});

router.get('/wakeitup', function(req, res, next) {
  res.render('wake.ejs', { title: 'It is on' });
});

module.exports = router;
