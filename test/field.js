'use strict';

require('mocha');
var assert = require('assert');
var Field = require('../lib/field');

describe('Field', function() {
  describe('class', function() {
    it('should export a function', function() {
      assert(typeof Field === 'function');
    });

    it('should create an instance of Field', function() {
      assert(new Field('string', {}) instanceof Field);
      assert(new Field('string') instanceof Field);
      assert(new Field({}) instanceof Field);
      assert(new Field() instanceof Field);
    });

    it('should expose a "types" getter', function() {
      var field = new Field();
      assert('types' in field);
    });

    it('should expose an "optional" getter', function() {
      var field = new Field('string', {});
      assert('optional' in field);
    });

    it('should expose a "required" getter', function() {
      var field = new Field('string', {});
      assert('required' in field);
    });

    it('should expose a validate method', function() {
      var field = new Field('string', {});
      assert.equal(typeof field.validate, 'function');
    });

    it('should expose a isValidType method', function() {
      var field = new Field('string', {});
      assert.equal(typeof field.isValidType, 'function');
    });

    it('should expose a normalize method', function() {
      var field = new Field('string', {});
      assert.equal(typeof field.normalize, 'function');
    });
  });

  describe('field.types', function() {
    it('should add field.types passed directly to ctor', function() {
      assert.deepEqual(new Field({}).types, []);
      assert.deepEqual(new Field('string', {}).types, ['string']);
      assert.deepEqual(new Field('string|array', {}).types, ['array', 'string']);
      assert.deepEqual(new Field(['string','array'], {}).types, ['array', 'string']);
    });

    it('should add field.types passed on config', function() {
      assert.deepEqual(new Field({}).types, []);
      assert.deepEqual(new Field({types: 'string'}).types, ['string']);
      assert.deepEqual(new Field({types: 'string|array'}).types, ['array', 'string']);
    });
  });

  describe('field.normalize', function() {
    it('should use custom normalize function', function() {
      var field = new Field({
        normalize: function(val) {
          return val.toUpperCase();
        }
      });

      var val = field.normalize('foo');
      assert.equal(val, 'FOO');
      assert.equal(field.val, 'FOO');
    });
  });

  describe('field.optional', function() {
    it('should set "field.cache.optional" property', function() {
      var field = new Field('string', {});
      field.optional = true;
      assert(field.optional);
      assert.equal(field.cache.optional, true);
    });

    it('should set "field.optional" to true when not defined', function() {
      assert.equal(new Field('string').optional, true);
      assert.equal(new Field('string', {}).optional, true);
    });

    it('should set "field.optional" with value from config', function() {
      assert.equal(new Field('string', {optional: true}).optional, true);
      assert.equal(new Field('string', {optional: false}).optional, false);
    });

    it('should set "field.optional" to true when field.required is false', function() {
      assert.equal(new Field('string', {required: false}).optional, true);
      assert.equal(new Field('string', {required: true}).optional, false);
      assert.equal(new Field('string', {optional: false, required: false}).optional, false);
      assert.equal(new Field('string', {optional: true, required: false}).optional, true);
      assert.equal(new Field('string', {optional: true, required: true}).optional, true);
    });
  });

  describe('field.required', function() {
    it('should set "field.cache.required" property', function() {
      var field = new Field('string', {});
      field.required = true;
      assert(field.required);
      assert.equal(field.cache.required, true);
    });

    it('should set "field.cache.required" property', function() {
      var field = new Field('string', {});
      field.required = true;
      assert(field.required);
      assert.equal(field.cache.required, true);
    });

    it('should get "field.required"', function() {
    });

    it('should get "field.required"', function() {
      assert.equal(new Field({required: true}).required, true);
      assert.equal(new Field('string', {required: true}).required, true);
      assert.equal(new Field('string', {required: false}).required, false);
    });

    it('should set "field.required" to false when not defined', function() {
      assert.equal(new Field('string', {}).required, false);
      assert.equal(new Field('string').required, false);
    });

    it('should set "field.required" to true when field.optional is false', function() {
      assert.equal(new Field('string', {optional: false}).required, true);
      assert.equal(new Field('string', {optional: true}).required, false);
    });

    it('should set "field.required" to correct value', function() {
      assert.equal(new Field('string', {optional: false, required: false}).required, false);
      assert.equal(new Field('string', {optional: true, required: false}).required, false);
    });
  });

  describe('field.isValidType', function() {
    it('should return true when the given value is a valid type', function() {
      var field = new Field('string', {});
      assert(field.isValidType('foo'));

      field = new Field(['array', 'string'], {});
      assert(field.isValidType([]));
      assert(field.isValidType('foo'));
    });

    it('should return false when the given type is invalid', function() {
      var field = new Field('string', {});
      assert(!field.isValidType([]));
      assert(!field.isValidType(function() {}));
      assert(!field.isValidType({}));
    });
  });

  describe('field.validate', function() {
    it('should call `field.isValidType` by default', function() {
      var field = new Field(['array', 'string'], {});
      assert(field.validate([]));
      assert(field.validate('foo'));
      assert(!field.validate(function() {}));
      assert(!field.validate({}));
    });

    it('should use custom validate method', function() {
      var field = new Field(['array', 'string'], {
        validate: function(val) {
          if (typeof val === 'string') {
            return val !== 'foo';
          }
          return true;
        }
      });

      assert(field.validate([]));
      assert(field.validate('bar'));
      assert(!field.validate('foo'));
      assert(!field.validate(function() {}));
      assert(!field.validate({}));
    });
  });
});
