'use strict';

require('mocha');
var assert = require('assert');
var Schema = require('..');
var schema;

describe('schema.isRequired', function() {
  beforeEach(function() {
    schema = new Schema();
  });

  it('should return true if a field was defined as required', function() {
    schema.field('keywords', 'array', {required: true});
    assert(schema.isRequired('keywords'));
  });

  it('should return false if a field was not defined as required', function() {
    schema.field('keywords', 'array');
    assert(!schema.isRequired('keywords'));
  });

  it('should return true if a field was defined as not optional', function() {
    schema.field('keywords', 'array', {optional: false});
    assert(schema.isRequired('keywords'));
  });
});
