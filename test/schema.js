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

    it('should expose a `validateField` method', function() {
      var schema = new Schema();
      assert.equal(typeof schema.validateField, 'function');
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
});
