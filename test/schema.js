'use strict';

require('mocha');
var assert = require('assert');
var Schema = require('..');
var schema;

describe('Schema', function() {
  describe('lib', function() {
    beforeEach(function() {
      schema = new Schema();
    });

    it('should export a function', function() {
      assert.equal(typeof Schema, 'function');
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

    it('should expose a `visit` method', function() {
      var schema = new Schema();
      assert.equal(typeof schema.visit, 'function');
    });
  });

  describe('visit', function() {
    beforeEach(function() {
      schema = new Schema();
    });

    it('should visit over an object and call the given method on `value`', function() {
      schema.visit('set', {foo: 'bar', baz: 'qux'});
      assert.equal(schema.foo, 'bar');
      assert.equal(schema.baz, 'qux');
    });
  });

  describe('update', function() {
    beforeEach(function() {
      schema = new Schema();
    });

    it('should update a field from the schema with the given value', function() {
      schema
        .field('license', 'string', {
          default: 'MIT'
        })
        .field('licenses', ['array', 'object'], {
          normalize: function(val, key, config, schema) {
            if (Array.isArray(val)) {
              schema.update('license', val[0].type, config);
              schema.omit(key);
            }
          }
        })

      var config = schema.normalize({licenses: [{type: 'Foo'}]});
      assert.equal(config.license, 'Foo');
      assert.equal(typeof config.licenses, 'undefined');
    });

    it('should update a field from the schema', function() {
      schema
        .field('license', 'string', {
          default: 'MIT'
        })
        .field('licenses', ['array', 'object'], {
          normalize: function(val, key, config, schema) {
            if (Array.isArray(val)) {
              schema.update('license', config);
              schema.omit(key);
            }
          }
        })

      var config = schema.normalize({licenses: [{type: 'Foo'}]});
      assert.equal(config.license, 'MIT');
      assert.equal(typeof config.licenses, 'undefined');
    });

    it('should get a property from a field on schema', function() {
      schema.field('name', 'string');
      var types = schema.get('name', 'types');
      assert(Array.isArray(types));
      assert.equal(types[0], 'string');
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
      assert.equal(types[0], 'string');
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
});
