'use strict';

require('mocha');
var assert = require('assert');
var Schema = require('..');
var schema;

describe('schema.field', function() {
  beforeEach(function() {
    schema = new Schema();
  });

  describe('ctor', function() {
    it('should add fields when passed on the constructor', function() {
      schema = new Schema({
        fields: {
          bugs: {
            types: ['object', 'string']
          }
        }
      });
      assert(schema.fields.hasOwnProperty('bugs'));
    });
  });

  describe('schema.field', function() {
    it('should add a field to `schema.fields`', function() {
      schema.field('bugs', ['object', 'string']);
      assert(schema.fields.hasOwnProperty('bugs'));
    });
  });

  describe('default', function() {
    // it('should add a default value to schema.defaults', function() {
    //   schema.field('bugs', ['object', 'string'], {
    //     default: 'foo'
    //   });
    //   assert(schema.defaults.hasOwnProperty('bugs'));
    // });

    it('should use the default value when normalize is invoked', function() {
      schema.field('bugs', ['object', 'string'], {
        default: 'foo'
      });

      var config = schema.normalize({});
      assert(config.hasOwnProperty('bugs'));
      assert.equal(config.bugs, 'foo');
    });

    it('should not overwrite an existing value with the default value', function() {
      schema.field('bugs', ['object', 'string'], {
        default: 'foo'
      });

      var config = schema.normalize({bugs: 'bar'});
      assert(config.hasOwnProperty('bugs'));
      assert.equal(config.bugs, 'bar');
    });
  });

  describe('required', function() {
    it('should add an error when a required field is undefined', function() {
      schema = new Schema({strict: true});
      schema.field('bugs', ['object', 'string'], {
        required: true
      });

      schema.normalize({});
      assert.equal(schema.errors.length, 1);
    });
  });
});
