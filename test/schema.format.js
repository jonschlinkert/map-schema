'use strict';

require('mocha');
const assert = require('assert');
const Schema = require('..');
let schema;

describe('schema.format()', () => {
  beforeEach(() => {
    schema = new Schema();
  });

  describe('errors', () => {
    it('should throw an error when a config object is not passed', () => {
      assert.throws(() => schema.format('foo'));
    });
  });

  describe('format', () => {
    it('should format a value', () => {
      schema.field('foo', {
        schema: 'string',
        format(value) {
          return value + value;
        }
      });

      let val = schema.format({ foo: 'bar' });
      assert.equal(val.foo, 'barbar');
    });

    it('should format multiple values', () => {
      schema
        .field('foo', {
          schema: 'string',
          format(value) {
            return (value || '') + 'a';
          }
        })
        .field('bar', {
          schema: 'string',
          format() {
            return 'b';
          }
        })
        .field('baz', {
          schema: 'string',
          format() {
            return 'c';
          }
        });

      let val = schema.format({ foo: 'bar', bar: '', baz: '' });
      assert.equal(val.foo, 'bara');
      assert.equal(val.bar, 'b');
      assert.equal(val.baz, 'c');
    });

    it('should format only existing properties', () => {
      schema
        .field('foo', {
          schema: 'string',
          format(value) {
            return (value || '') + 'a';
          }
        })
        .field('bar', {
          schema: 'string',
          format(value) {
            return value !== void 0 ? 'b' : void 0;
          }
        })
        .field('baz', {
          schema: 'string',
          format(value) {
            return value !== void 0 ? 'c' : void 0;
          }
        });

      let val = schema.format({ foo: 'bar' });
      assert.equal(val.foo, 'bara');
      assert.equal(val.bar, void 0);
      assert.equal(val.baz, void 0);
    });
  });

  describe('defaults', () => {
    beforeEach(() => {
      schema.field('version', { schema: 'string', default: '0.1.0' });
      schema.field('keywords', { schema: 'array', default: ['bar', 'foo'] });
    });

    it('should fill in missing values using defaults', () => {
      let actual = schema.format({});
      assert.equal(actual.version, '0.1.0');
      assert.equal(actual.keywords[0], 'bar');
      assert.equal(actual.keywords[1], 'foo');
    });

    it('should track missing fields', () => {
      let actual = schema.format({});
      assert.equal(actual.version, '0.1.0');
      assert.equal(actual.keywords[0], 'bar');
      assert.equal(actual.keywords[1], 'foo');
    });

    it('should allow arbitrary fields on the config', () => {
      let actual = schema.format({ arbitrary: ['z', 'a'] });
      assert(Array.isArray(actual.arbitrary));
    });

    it('should not sort keys in arrays by default', () => {
      let actual = schema.format({ arbitrary: ['z', 'a'] });
      assert.equal(actual.arbitrary[0], 'z');
      assert.equal(actual.arbitrary[1], 'a');
    });
  });

  describe('omit', () => {
    it('should omit a field from the config when format is called', () => {
      schema = new Schema({ omit: 'keywords' });
      let actual = schema.format({ keywords: ['z', 'a'], foo: 'bar' });
      assert.equal(typeof actual.keywords, 'undefined');
      assert.equal(actual.foo, 'bar');
    });
  });

  describe('only', () => {
    it('should only include the specified fields', () => {
      schema = new Schema({ only: ['a', 'c'] });
      let actual = schema.format({ a: 'a', b: 'b', c: 'c' }, { only: ['a', 'c'] });
      assert(actual.hasOwnProperty('a'));
      assert(actual.hasOwnProperty('c'));
      assert(!actual.hasOwnProperty('b'));
    });
  });

  describe('sortArrays', () => {
    it('should sort arrays in the given config object', () => {
      let arr = schema.format({
        name: 'foo',
        keywords: ['x', 'z', 'a'],
        bar: ['two', 'one']
      },
      {
        sortArrays: true
      });

      assert.equal(arr.keywords[0], 'a');
      assert.equal(arr.keywords[2], 'z');
      assert.equal(arr.bar[0], 'one');
    });

    it('should sort arrays when `schema.options.sortArrays` is true', () => {
      schema.options.sortArrays = true;

      let arr = schema.format({
        name: 'foo',
        keywords: ['x', 'z', 'a'],
        bar: ['two', 'one']
      });

      assert.equal(arr.keywords[0], 'a');
      assert.equal(arr.keywords[2], 'z');
      assert.equal(arr.bar[0], 'one');
    });
  });

  describe('sortObject', () => {
    it('should sort the keys in an object based on the given `keys`', () => {
      schema.field('bar', { schema: ['string'] });
      schema.field('baz', { schema: ['string'] });
      schema.field('foo', { schema: ['string'] });

      let config = {
        foo: '',
        bar: '',
        baz: ''
      };

      let actual = schema.format(config, {
        sortBy: ['baz', 'foo', 'bar']
      });

      let keys = Object.keys(actual);
      assert.equal(keys[0], 'baz');
      assert.equal(keys[1], 'foo');
      assert.equal(keys[2], 'bar');
    });

    it('should ignore missing keys', () => {
      schema.field('bar', 'string');
      schema.field('baz', 'string');
      schema.field('foo', 'string');

      let config = { foo: '', bar: '', qux: '', baz: '' };
      let actual = schema.format(config, { sortBy: ['baz', 'bar', 'foo', 'qux'] });
      let keys = Object.keys(actual);

      assert.equal(keys.length, 4);
      assert.equal(keys[0], 'baz');
      assert.equal(keys[1], 'bar');
      assert.equal(keys[2], 'foo');
      assert.equal(keys[3], 'qux');
    });
  });
});
