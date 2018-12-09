'use strict';

const fs = require('fs');
const typeOf = require('kind-of');
const pkg = require('../package');
const Schema = require('..');

function verb(config, options) {
  let schema = new Schema(options);

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
let schema = new Schema()
  .field('name', 'string')
  .field('description', 'string')
  .field('repository', ['object', 'string'], {
    normalize: function(val) {
      return typeOf(val) === 'object' ? val.url : val;
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
        let schema = verb(schema.options);
        val = config[key] = schema.normalize(val);
        return val;
      }
    }
  })

// normalize an object
let res = schema.normalize(pkg);
console.log(res.verb);

// validation errors array
console.log(schema.warnings);
console.log(schema.errors);
