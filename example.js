'use strict';

var fs = require('fs');
var isObject = require('isobject');
var Schema = require('./');

var schema = new Schema()
  .field('name', 'string')
  .field('description', 'string')
  .field('repository', ['object', 'string'], {
    normalize: function(val) {
      return isObject(val) ? val.url : val;
    }
  })
  .field('main', 'string', {
    validate: function(filepath) {
      console.log(filepath)
      return fs.existsSync(filepath);
    }
  })
  .field('version', 'string', {
    default: '0.1.0'
  })
  .field('license', 'string', {
    default: 'MIT'
  })

var pkg = require('./package');
console.log(schema.normalize(pkg));
console.log(schema.errors);
