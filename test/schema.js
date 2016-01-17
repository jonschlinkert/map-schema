'use strict';

require('mocha');
var assert = require('assert');
var Schema = require('..');
var schema;

describe('Schema', function() {
  beforeEach(function() {
    schema = new Schema();
  });

  it('should export a function', function() {
    assert(typeof Schema === 'function');
  });

  it('should instantiate', function() {
    assert(schema instanceof Schema);
  });

  it('should expose a `validate` method', function() {
    var schema = new Schema();
    assert.equal(typeof schema.validate, 'function');
  });

  it('should expose a `normalize` method', function() {
    var schema = new Schema();
    assert.equal(typeof schema.normalize, 'function');
  });

  it('should expose a `field` method', function() {
    var schema = new Schema();
    assert.equal(typeof schema.field, 'function');
  });
});

describe('field', function() {
  beforeEach(function() {
    schema = new Schema();
  });

  it('should throw an error when types are not defined', function(cb) {
    try {
      schema.field('foo');
      cb(new Error('expected an error'));
    } catch (err) {
      assert.equal(err.message, 'expected type to be a string or array of JavaScript native types');
      cb();
    }
  });

  it('should add a field when passed on the constructor', function() {
    schema = new Schema({
      fields: {
        bugs: {
          types: ['object', 'string']
        }
      }
    });
    assert(schema.fields.hasOwnProperty('bugs'));
  });

  it('should add a field to `schema.fields`', function() {
    schema.field('bugs', ['object', 'string']);
    assert(schema.fields.hasOwnProperty('bugs'));
  });

  it('should add a default value to schema.defaults', function() {
    schema.field('bugs', ['object', 'string'], {
      default: 'foo'
    });
    assert(schema.defaults.hasOwnProperty('bugs'));
  });

  it('should add a required value to the schema.required array', function() {
    schema.field('bugs', ['object', 'string'], {
      required: 'foo'
    });
    assert.equal(schema.required[0], 'bugs');
  });
});

describe('get', function() {
  beforeEach(function() {
    schema = new Schema();
  });

  it('should get a field from the schema', function() {
    schema.field('name', 'string');
    var field = schema.get('name');
    assert(field);
    assert(field.types);
  });

  it('should get a property from a field on schema', function() {
    schema.field('name', 'string');
    var types = schema.get('name', 'types');
    assert(Array.isArray(types));
    assert(types[0] === 'string');
  });
});

describe('validate', function() {
  beforeEach(function() {
    schema = new Schema();
  });

  it('should throw an error when a config object is not passed', function(cb) {
    try {
      schema.validate('foo');
      cb(new Error('expected an error'));
    } catch (err) {
      assert.equal(err.message, 'expected config to be an object');
      cb();
    }
  });
});
