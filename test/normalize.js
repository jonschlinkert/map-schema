'use strict';

require('mocha');
var assert = require('assert');
var Schema = require('..');
var schema;

describe('schema.normalize()', function() {
  beforeEach(function() {
    schema = new Schema();
  });

  describe('errors', function() {
    it('should throw an error when a config object is not passed', function(cb) {
      try {
        schema.normalize('foo');
        cb(new Error('expected an error'));
      } catch (err) {
        assert.equal(err.message, 'expected config to be an object');
        cb();
      }
    });
  });

  describe('defaults', function() {
    beforeEach(function() {
      schema
        .field('version', 'string', {
          default: '0.1.0'
        })
        .field('keywords', 'array', {
          default: ['bar', 'foo']
        })
    });

    it('should fill in missing values using defaults', function() {
      var actual = schema.normalize({});
      assert.equal(actual.version, '0.1.0');
      assert.equal(actual.keywords[0], 'bar');
      assert.equal(actual.keywords[1], 'foo');
    });

    it('should allow arbitrary fields on the config', function() {
      var actual = schema.normalize({arbitrary: ['z', 'a']});
      assert(Array.isArray(actual.arbitrary));
    });

    it('should sort keys in arrays by default', function() {
      var actual = schema.normalize({arbitrary: ['z', 'a']});
      assert.equal(actual.arbitrary[0], 'a');
      assert.equal(actual.arbitrary[1], 'z');
    });
  });

  describe('omit', function() {
    it('should omit a field from the config when normalize is called', function() {
      schema.omit('keywords');
      var actual = schema.normalize({keywords: ['z', 'a'], foo: 'bar'});
      assert.equal(typeof actual.keywords, 'undefined');
      assert.equal(actual.foo, 'bar');
    });
  });

  describe('only', function() {
    it('should only include the specified fields', function() {
      var actual = schema.normalize({a: 'a', b: 'b', c: 'c'}, {only: ['a', 'c']});
      assert(actual.hasOwnProperty('a'));
      assert(actual.hasOwnProperty('c'));
      assert(!actual.hasOwnProperty('b'));
    });
  });

  describe('isOptional', function() {
    it('should return true if a field was defined as isOptional', function() {
      schema.field('keywords', 'array', {
        optional: true
      });
      assert(schema.isOptional('keywords'));
    });

    it('should return true if isOptional was not defined', function() {
      schema.field('keywords', 'array');
      assert(schema.isOptional('keywords'));
    });

    it('should return false if isOptional was defined as false', function() {
      schema.field('keywords', 'array', {
        optional: false
      });
      assert(!schema.isOptional('keywords'));
    });
  });

  describe('isRequired', function() {
    it('should return true if a field was defined as required', function() {
      schema.field('keywords', 'array', {
        required: true
      });
      assert(schema.isRequired('keywords'));
    });

    it('should return false if a field was not defined as required', function() {
      schema.field('keywords', 'array');
      assert(!schema.isRequired('keywords'));
    });

    it('should return true if a field was defined as not optional', function() {
      schema.field('keywords', 'array', {
        optional: false
      });
      assert(schema.isRequired('keywords'));
    });
  });

  describe('missingFields', function() {
    it('should return an array of missing fields', function() {
      schema.field('name', 'string', {
        required: true
      });
      schema.field('keywords', 'array', {
        required: true
      });

      var actual = schema.missingFields({
        name: 'foo'
      });

      assert.equal(actual.length, 1);
      assert.equal(actual[0], 'keywords');
    });
  });

  describe('omitEmpty', function() {
    it('should omit empty fields from a config', function() {
      var config = schema.normalize({a: 'b', c: {}}, {omitEmpty: true});
      assert.equal(config.a, 'b');
      assert.equal(typeof config.c, 'undefined');
    });
  });

  describe('isValidType', function() {
    it('should validate the type of a field', function() {
      schema.field('foo', 'array');
      var isValid = schema.isValidType('foo', 'bar');
      assert(!isValid);
    });
  });

  describe('setDefaults', function() {
    it('should set default values on an object', function() {
      schema.field('version', 'string', {
        default: '0.1.0'
      });
      schema.field('keywords', 'array', {
        default: ['foo', 'bar']
      });

      var config = schema.setDefaults({});
      assert.equal(config.version, '0.1.0');
      assert.equal(config.keywords[0], 'foo');
      assert.equal(config.keywords[1], 'bar');
    });

    it('should not set defaults when `options.defaults` is false', function() {
      schema.field('version', 'string', {
        default: '0.1.0'
      });
      schema.field('keywords', 'array', {
        default: ['foo', 'bar']
      });

      schema.options.defaults = false;

      var config = schema.setDefaults({});
      assert.equal(typeof config.version, 'undefined');
      assert.equal(typeof config.keywords, 'undefined');
    });
  });

  describe('sortArrays', function() {
    it('should sort arrays in the given config object', function() {
      var arr = schema.sortArrays({
        name: 'foo',
        keywords: ['x', 'z', 'a'],
        bar: ['two', 'one']
      });

      assert.equal(arr.keywords[0], 'a');
      assert.equal(arr.keywords[2], 'z');
      assert.equal(arr.bar[0], 'one');
    });

    it('should not sort arrays when `options.sortArrays` is false', function() {
      schema.options.sortArrays = false;

      var arr = schema.sortArrays({
        name: 'foo',
        keywords: ['x', 'z', 'a'],
        bar: ['two', 'one']
      });

      assert.equal(arr.keywords[0], 'x');
      assert.equal(arr.keywords[2], 'a');
      assert.equal(arr.bar[0], 'two');
    });
  });

  describe('sortObject', function() {
    it('should sort the keys in an object based on the given `keys`', function() {
      schema.field('bar', 'string');
      schema.field('baz', 'string');
      schema.field('foo', 'string');

      var config = {
        foo: '',
        bar: '',
        baz: ''
      };

      var actual = schema.sortObject(config, ['baz', 'bar', 'foo']);
      var keys = Object.keys(actual);

      assert(keys[0], 'baz');
      assert(keys[1], 'bar');
      assert(keys[2], 'foo');
    });

    it('should ignore missing keys', function() {
      schema.field('bar', 'string');
      schema.field('baz', 'string');
      schema.field('foo', 'string');

      var config = {
        foo: '',
        bar: '',
        baz: ''
      };

      var actual = schema.sortObject(config, ['baz', 'bar', 'foo', 'qux']);
      var keys = Object.keys(actual);

      assert(keys[0], 'baz');
      assert(keys[1], 'bar');
      assert(keys[2], 'foo');
    });
  });

  describe('.normalize', function() {
    it('should normalize a value', function() {
      schema.field('foo', ['string'], function(val) {
        return val + val;
      });

      var val = schema.normalize({foo: 'bar'});
      assert.equal(val.foo, 'barbar');
    });

    it('should normalize multiple values', function() {
      schema
        .field('foo', ['string'], function(val) {
          return 'a';
        })
        .field('bar', ['string'], function(val) {
          return 'b';
        })
        .field('baz', ['string'], function(val) {
          return 'c';
        })

      var val = schema.normalize({foo: 'bar', bar: '', baz: ''});
      assert.equal(val.foo, 'a');
      assert.equal(val.bar, 'b');
      assert.equal(val.baz, 'c');
    });

    it('should normalize only existing properties', function() {
      schema
        .field('foo', ['string'], function(val) {
          return 'a';
        })
        .field('bar', ['string'], function(val) {
          return 'b';
        })
        .field('baz', ['string'], function(val) {
          return 'c';
        })

      var val = schema.normalize({foo: 'bar'}, {existingOnly: true});
      assert.equal(val.foo, 'a');
      assert.equal(typeof val.bar, 'undefined');
      assert.equal(typeof val.baz, 'undefined');
    });
  });
});