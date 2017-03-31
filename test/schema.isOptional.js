'use strict';

require('mocha');
var assert = require('assert');
var Schema = require('..');
var schema;

describe('schema.isOptional', function() {
  beforeEach(function() {
    schema = new Schema();
  });

  it('should return true if a field was defined as optional', function() {
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
    schema.field('keywords', 'array', {optional: false});
    assert(!schema.isOptional('keywords'));
  });
});
