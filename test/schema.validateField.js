'use strict';

require('mocha');
var assert = require('assert');
var Schema = require('..');
var schema;

describe('schema.validateField', function() {
  beforeEach(function() {
    schema = new Schema();
  });

  it('should throw an error when a config object is not passed', function(cb) {
    try {
      schema.validateField('foo');
      cb(new Error('expected an error'));
    } catch (err) {
      assert.equal(err.message, 'expected an instance of Field');
      cb();
    }
  });
});

