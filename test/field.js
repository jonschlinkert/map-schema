'use strict';

require('mocha');
var assert = require('assert');
var Field = require('../lib/field');

describe('Field', function() {
  it('should export a function', function() {
    assert(typeof Field === 'function');
  });

  it('should throw an error when a config object is not passed', function(cb) {
    try {
      new Field({});
      cb(new Error('expected an error'));
    } catch (err) {
      assert.equal(err.message, 'expected type to be a string or array of JavaScript native types');
      cb();
    }
  });

  it('should throw an error when a config object is not passed', function(cb) {
    try {
      new Field('string');
      cb(new Error('expected an error'));
    } catch (err) {
      assert.equal(err.message, 'expected config to be an object');
      cb();
    }
  });

  it('should create an instance of Field', function() {
    assert(new Field('string', {}) instanceof Field);
  });

  it('should expose a validate method', function() {
    var field = new Field('string', {});
    assert.equal(typeof field.validate, 'function');
  });

  it('should expose a isValidType method', function() {
    var field = new Field('string', {});
    assert.equal(typeof field.isValidType, 'function');
  });

  it('should expose a normalize method', function() {
    var field = new Field('string', {});
    assert.equal(typeof field.normalize, 'function');
  });
});

describe('isValidType', function() {
  it('should return true when the given value is a valid type', function() {
    var field = new Field('string', {});
    assert(field.isValidType('foo'));

    field = new Field(['array', 'string'], {});
    assert(field.isValidType([]));
    assert(field.isValidType('foo'));
  });

  it('should return false when the given type is invalid', function() {
    var field = new Field('string', {});
    assert(!field.isValidType([]));
    assert(!field.isValidType(function() {}));
    assert(!field.isValidType({}));
  });
});
