'use strict';

require('mocha');
const assert = require('assert');
const Schema = require('..');
let schema;

describe('schema.field', function() {
  beforeEach(function() {
    schema = new Schema();
  });

  describe('ctor', function() {
    it('should add fields when passed on the constructor', function() {
      schema = new Schema({
        fields: {
          bugs: {
            schema: ['object', 'string']
          }
        }
      });
      assert(schema.fields.has('bugs'));
    });
  });

  describe('schema.field', function() {
    it('should add a field to `schema.cache.fields`', function() {
      schema.field('bugs', ['object', 'string']);
      assert(schema.fields.has('bugs'));
    });
  });

  describe('default', function() {
    it('should use the default value when normalize is invoked', function() {
      schema.field('bugs', {
        schema: ['object', 'string'],
        default: 'foo'
      });

      let config = schema.format({});
      assert(config.hasOwnProperty('bugs'));
      assert.equal(config.bugs, 'foo');
    });

    it('should not overwrite an existing value with the default value', function() {
      schema.field('bugs', {
        schema: ['object', 'string'],
        default: 'foo'
      });

      let config = schema.format({bugs: 'bar'});
      assert(config.hasOwnProperty('bugs'));
      assert.equal(config.bugs, 'bar');
    });
  });

  describe('required', function() {
    it('should add an error when a required field is undefined', function() {
      schema = new Schema();
      schema.field('bugs', {
        schema: ['object', 'string'],
        required: true
      });

      schema.format({});
      assert.equal(schema.state.errors.size, 1);
    });
  });
});
