'use strict';

require('mocha');
var assert = require('assert');
var Schema = require('..');
var schema;

describe('get', function() {
  beforeEach(function() {
    schema = new Schema();
  });

  it('should get a field from the schema', function() {
    schema.field('name', 'string');
    var field = schema.get('name');
    assert(field);
    assert(field.types);
  });

  it('should get a property from a field on schema', function() {
    schema.field('name', 'string');
    var types = schema.get('name', 'types');
    assert(Array.isArray(types));
    assert.equal(types[0], 'string');
  });
});
