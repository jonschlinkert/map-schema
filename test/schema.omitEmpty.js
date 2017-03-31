'use strict';

require('mocha');
var assert = require('assert');
var Schema = require('..');
var schema;

describe('schema.omitEmpty', function() {
  beforeEach(function() {
    schema = new Schema();
  })

  it('should omit empty fields from a config', function() {
    var config = schema.normalize({a: 'b', c: {}}, {omitEmpty: true});
    assert.equal(config.a, 'b');
    assert.equal(typeof config.c, 'undefined');
  });
});
