
/**
 * Module dependencies.
 */

var connect = require('./');

var router = connect.router(function(app){
  function one(req, res, next) {
    console.log('one');
    next();
  }
  
  function two(req, res, next) {
    console.log('two');
    next();
  }

  app.param('user', one, two);

  app.get('/user/:user', one, two, function(req, res){
    res.end('yay');
  });
});

connect(router).listen(3000);