'use strict';

var fs = require('fs');
var isObject = require('isobject');
var Schema = require('..');
var pkg = require('../package');

var verb = new Schema();

verb.field('toc', ['boolean', 'object'], {
  normalize: function(val, key, config, schema) {
    if (typeof val === 'boolean') {
      val = { render: val };
    }
    return val;
  }
});

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
  .field('verb', ['object'], verb)
  .field('zzz', ['object'], verb2)
  .field('blah', function() {
    return 'whatever';
  })

function verb2() {
  var schema = new Schema();

  schema.field('toc', ['boolean', 'object'], {
    normalize: function(val, key, config, schema) {
      if (typeof val === 'undefined') {
        val = true;
      }
      if (typeof val === 'boolean') {
        val = { render: val };
      }
      return val;
    }
  });

  return schema;
}

var res = schema.normalize(pkg);
console.log(schema.config.verb);

// validation errors array
console.log(schema.warnings);
console.log(schema.errors);

