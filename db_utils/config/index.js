'use strict'
var env = process.env.NODE_ENV || 'test';
var config = require('./' + env);
console.log(config);
module.exports = config;