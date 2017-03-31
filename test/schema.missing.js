'use strict';

require('mocha');
var assert = require('assert');
var Schema = require('..');
var schema;

describe('schema.missing', function() {
  beforeEach(function() {
    schema = new Schema();
  });

  it('should return an array of missing fields', function() {
    schema.field('name', 'string', {required: true});
    schema.field('keywords', 'array', {required: true});

    var missing = schema.missing({name: 'foo'});

    assert.equal(missing.length, 1);
    assert.equal(missing[0], 'keywords');
  });
});
