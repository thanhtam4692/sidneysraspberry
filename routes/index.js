var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index.ejs', { title: 'Tam Thanh Tran' });
});

router.get('/wakeitup', function(req, res, next) {
  res.render('wake.ejs', { title: 'It is on' });
});

module.exports = router;
