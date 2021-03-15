// app.js
var express = require('express');
var app = express();

var AccessController = require('./controllers/AccessController');
app.use('/accessControl', AccessController);

module.exports = app;