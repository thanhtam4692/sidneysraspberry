var express = require('express');
var router = express.Router();

/* POST*/
router.post('/', function(req, res, next) {
  res.render('portfolio.ejs');
});

router.post('/entries', function(req, res, next) {
  console.log("Getting: " + req.body.entryId);
  res.render('./portfolio/' + req.body.entryId + '.ejs');
});

module.exports = router;
