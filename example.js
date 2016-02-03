'use strict';

var fs = require('fs');
var Schema = require('map-schema');
var isObject = require('isobject');

// create a schema
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
// normalize an object
console.log(schema.normalize(pkg));
// validation errors array
console.log(schema.errors);
