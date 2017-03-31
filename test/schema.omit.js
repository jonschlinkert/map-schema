'use strict';

require('mocha');
var assert = require('assert');
var Schema = require('..');
var schema;

describe('schema.omit', function() {
  beforeEach(function() {
    schema = new Schema();
  })

  it('should add keys to schema.actions.omit', function() {
    schema.omit('foo');
    schema.omit('bar');
    schema.omit('baz');
    assert.equal(schema.cache.omit.length, 3);
  });
});
