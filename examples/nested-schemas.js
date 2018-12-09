'use strict';

const fs = require('fs');
const typeOf = require('kind-of');
// const pkg = require('../package');
const Schema = require('..');
const verb = new Schema();
const pkg = {};

verb.field('toc', {
  schema: ['boolean', 'object'],
  format(value) {
    if (typeOf(value) !== 'object') {
      value = { render: value };
    }
    value.render = value.render === true;
    return value;
  }
});

// create a schema
let schema = new Schema()
  .field('name', { schema: 'string'})
  .field('description', { schema: 'string'})
  .field('repository', {
    schema: ['object', 'string'],
    format(value) {
      if (typeOf(value) === 'object') {
        return value.url;
      }
      return value;
    }
  })
  .field('main', {
    schema: 'string',
    validate(value) {
      return fs.existsSync(value);
    }
  })
  .field('version', {
    schema: 'string',
    default: '0.1.0'
  })
  .field('license', {
    schema: 'string',
    default: 'MIT'
  })
  .field('verb', verb)
  .field('blah', {
    format() {
      return 'whatever';
    }
  })

let res = schema.format(pkg, { sortBy: ['name', 'version'] });
console.log(res)
// console.log(schema.state);

