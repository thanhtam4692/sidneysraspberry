var express = require('express');
var router = express.Router();

// Get page Portfolio
router.get('/', function(req, res, next) {
  res.render('index/index.ejs', { title: 'portfolio' });
});
router.post('/', function(req, res, next) {
  res.render('portfolio/portfolio.ejs');
});

// Porfolio entries
router.post('/entries', function(req, res, next) {
  console.log("Getting: " + req.body.entryId);
  res.render('portfolio/' + req.body.entryId + '.ejs');
});

module.exports = router;
