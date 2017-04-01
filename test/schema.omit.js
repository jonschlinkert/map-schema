'use strict';

require('mocha');
var assert = require('assert');
var Schema = require('..');
var schema;

describe('schema.omit', function() {
  beforeEach(function() {
    schema = new Schema();
  })

  it('should add keys defined as a string to schema.cache.omit', function() {
    schema.omit('foo');
    schema.omit('bar');
    schema.omit('baz');
    assert.equal(schema.cache.omit.length, 3);
  });

  it('should add an array of keys to schema.cache.omit', function() {
    schema.omit(['foo', 'bar', 'baz']);
    assert.equal(schema.cache.omit.length, 3);
  });

  it('should omit properties from the given object', function() {
    schema.omit(['foo', 'bar', 'baz']);
    var config = schema.omit({
      foo: 'foo',
      bar: 'bar',
      baz: 'baz',
      qux: 'qux'
    });

    assert.equal(schema.cache.omit.length, 3);
    assert.deepEqual(config, {qux: 'qux'});
  });
});
