'use strict';

var fs = require('fs');
var Schema = require('./');
var isObject = require('isobject');

function verb(config, options) {
  var schema = new Schema(options);

  schema.field('toc', ['boolean', 'object'], {
    normalize: function(val, key, config, schema) {
      if (typeof val === 'boolean') {
        val = { render: val };
      }
      return val;
    }
  });

  return schema;
}


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
  .field('verb', ['object'], {
    normalize: function(val, key, config, schema) {
      if (typeof val !== 'undefined') {
        var schema = verb(schema.options);
        val = config[key] = schema.normalize(val);
        console.log(val)
        return val;
      }
    }
  })

var pkg = require('./package');
// normalize an object
var res = schema.normalize(pkg);
// console.log(res);
// validation errors array
// console.log(schema.warnings);
