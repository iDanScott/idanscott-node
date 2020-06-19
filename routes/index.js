var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Dan Scott Software Engineer' });
});

router.get('/dialogflow-converter', function(req, res, next) {
  res.render('dialogflowConverter', { title: 'Dan Scott Software Engineer' });
});

module.exports = router;
