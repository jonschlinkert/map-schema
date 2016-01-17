'use strict';

require('mocha');
var assert = require('assert');
var utils = require('../lib/utils');
var Schema = require('..');
var schema;

describe('Schema', function() {
  beforeEach(function() {
    schema = new Schema();
  });

  it('should expose a "data" object', function() {
    assert(schema.data);
    assert(utils.isObject(schema.data));
  });

  it('should set properties on `schema.data`', function() {
    schema.data.set('foo', 'bar');
    assert.equal(schema.data.foo, 'bar');
  });

  it('should support passing key as an array to set', function() {
    schema.data.set(['x', 'y'], 'z');
    assert.equal(schema.data.x.y, 'z');
  });

  it('should set nested properties on `schema.data`', function() {
    schema.data.set('a.b.c', 'def');
    assert.equal(schema.data.a.b.c, 'def');
  });

  it('should get a value from `schema.data`', function() {
    schema.data.set('abc', 'xyz');
    assert.equal(schema.data.get('abc'), 'xyz');
  });

  it('should support passing key as an array to get', function() {
    schema.data.set('x.y', 'z');
    assert.equal(schema.data.get(['x', 'y']), 'z');
  });

  it('should get a nested value from `schema.data`', function() {
    schema.data.set('a.b.c', 'xyz');
    assert.equal(schema.data.a.b.c, 'xyz');
    assert.equal(schema.data.get('a.b.c'), 'xyz');
  });

  it('should merge an object onto `schema.data`', function() {
    schema.data.merge({one: 'two'});
    assert.equal(schema.data.one, 'two');
  });

  it('should allow merge to chain', function() {
    schema.data
      .merge({a: 'b'})
      .merge({c: 'd'});

    assert.equal(schema.data.a, 'b');
    assert.equal(schema.data.c, 'd');
  });
});
