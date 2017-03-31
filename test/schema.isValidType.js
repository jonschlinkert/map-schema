'use strict';

require('mocha');
var assert = require('assert');
var Schema = require('..');
var schema;

describe('schema.isValidType', function() {
  beforeEach(function() {
    schema = new Schema();
  });

  it('should return true if the given value is a valid type', function() {
    schema.field('abc', 'array');
    schema.field('xyz', 'string|array');

    assert(!schema.isValidType('abc', 'bar'));
    assert(schema.isValidType('abc', ['bar']));

    assert(schema.isValidType('xyz', 'bar'));
    assert(schema.isValidType('xyz', ['bar']));
  });
});
