'use strict';

require('mocha');
const assert = require('assert');
const { Field } = require('..');

describe('Field', () => {
  describe('class', () => {
    it('should export a function', () => {
      assert.equal(typeof Field, 'function');
    });

    it('should create an instance of Field', () => {
      assert(new Field('string', {}) instanceof Field);
      assert(new Field('string') instanceof Field);
      assert(new Field({}) instanceof Field);
      assert(new Field() instanceof Field);
    });

    it('should have a "schema" property', () => {
      let field = new Field({ schema: 'string' });
      assert.equal(field.schema, 'string');
      assert.equal(typeof field.schema, 'string');
    });

    it('should have a "required" boolean', () => {
      let field = new Field({ schema: 'string' });
      assert.equal(typeof field.required, 'boolean');
    });

    it('should have a validate method', () => {
      let field = new Field('string', {});
      assert.equal(typeof field.validate, 'function');
    });

    it('should have a format method', () => {
      let field = new Field('string', {});
      assert.equal(typeof field.format, 'function');
    });
  });

  describe('field.schema', () => {
    it('should add field.schema passed directly to ctor', () => {
      assert.deepEqual(new Field({}).schema, 'any');
      assert.deepEqual(new Field({ schema: 'string' }).schema, 'string');
      assert.deepEqual(new Field({ schema: ['array', 'string'] }).schema, 'array|string');
      assert.deepEqual(new Field({ schema: 'string|array' }).schema, 'string|array');
    });
  });

  describe('field.format', () => {
    it('should use custom format function', () => {
      let field = new Field({
        format(value) {
          return value.toUpperCase();
        }
      });

      let value = field.format('foo');
      assert.equal(value, 'FOO');
    });
  });

  describe('field.validate', () => {
    it('should call `field.isValidType` by default', () => {
      let field = new Field(['array', 'string'], {});
      assert(field.validate([]));
      assert(field.validate('foo'));
      assert(!field.validate(() => {}));
      assert(!field.validate({}));
    });

    it('should use custom validate method', () => {
      let field = new Field({
        schema: ['array', 'string'],
        validate(value) {
          if (typeof value === 'string') {
            return value !== 'foo';
          }
          return true;
        }
      });

      assert(field.validate([]));
      assert(field.validate('bar'));
      assert(!field.validate('foo'));
      assert(!field.validate(() => {}));
      assert(!field.validate({}));
    });
  });
});
