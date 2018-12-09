'use strict';

require('mocha');
const assert = require('assert');
const Schema = require('..');
let schema;

describe('map-schema', () => {
  beforeEach(() => {
    schema = new Schema();
  });

  it('should export a function', () => {
    assert.equal(typeof Schema, 'function');
  });

  it('should instantiate', () => {
    assert(schema instanceof Schema);
  });

  it('should expose a `parse` method', () => {
    assert.equal(typeof schema.parse, 'function');
  });

  it('should expose a `format` method', () => {
    assert.equal(typeof schema.format, 'function');
  });

  it('should expose a `field` method', () => {
    assert.equal(typeof schema.field, 'function');
  });
});
