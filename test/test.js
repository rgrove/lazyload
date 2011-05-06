#!/usr/bin/env node
/**
Run this script with Node.js 0.4.x and browse to http://localhost:3000/ to
see the test page for LazyLoad.
**/

var express = require('express'),

    app = express.createServer(
      express.logger(),
      express.static(__dirname + '/public'),
      express.errorHandler({dumpExceptions: true, showStack: true})
    );

function delayable(req, res, next) {
  setTimeout(next, req.param('delay', 0));
}

app.get('/', function (req, res) {
  res.redirect('/index.html', 303);
});

app.get('/css', delayable, function (req, res) {
  var num = req.param('num');

  res.header('Content-Type', 'text/css; charset=utf-8');
  res.send(
    '#css-status { background-color: ' + (num === '5' ? 'green' : 'red') + '; }\n' +
    '#n' + num + ' { width: 5px; }\n'
  );
});

app.get('/js', delayable, function (req, res) {
  res.header('Content-Type', 'application/javascript; charset=utf-8');
  res.send('jslog("script ' + req.param('num') + ' executed");');
});

app.listen(3000);
