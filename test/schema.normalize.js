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

  describe('normalize', function() {
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

    it('should not sort keys in arrays by default', function() {
      var actual = schema.normalize({arbitrary: ['z', 'a']});
      assert.equal(actual.arbitrary[0], 'z');
      assert.equal(actual.arbitrary[1], 'a');
    });

    it('should set default values on an object', function() {
      schema.field('version', 'string', {
        default: '0.1.0'
      });
      schema.field('keywords', 'array', {
        default: ['foo', 'bar']
      });

      var config = schema.normalize({});
      assert.equal(config.version, '0.1.0');
      assert.equal(config.keywords[0], 'foo');
      assert.equal(config.keywords[1], 'bar');
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

  describe('sortArrays', function() {
    it('should sort arrays in the given config object', function() {
      var arr = schema.normalize({
        name: 'foo',
        keywords: ['x', 'z', 'a'],
        bar: ['two', 'one']
      }, {
        sortArrays: true
      });

      assert.equal(arr.keywords[0], 'a');
      assert.equal(arr.keywords[2], 'z');
      assert.equal(arr.bar[0], 'one');
    });

    it('should sort arrays when `schema.options.sortArrays` is true', function() {
      schema.options.sortArrays = true;

      var arr = schema.normalize({
        name: 'foo',
        keywords: ['x', 'z', 'a'],
        bar: ['two', 'one']
      });

      assert.equal(arr.keywords[0], 'a');
      assert.equal(arr.keywords[2], 'z');
      assert.equal(arr.bar[0], 'one');
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

      var actual = schema.normalize(config, {
        sortBy: ['baz', 'foo', 'bar']
      });

      var keys = Object.keys(actual);
      assert(keys[0], 'baz');
      assert(keys[1], 'foo');
      assert(keys[2], 'bar');
    });

    it('should ignore missing keys', function() {
      schema.field('bar', 'string');
      schema.field('baz', 'string');
      schema.field('foo', 'string');

      var config = {foo: '', bar: '', qux: ''};
      var actual = schema.sortObject(config, ['baz', 'bar', 'foo', 'qux']);
      var keys = Object.keys(actual);

      assert(keys[0], 'baz');
      assert(keys[1], 'bar');
      assert(keys[2], 'qux');
    });
  });
});
