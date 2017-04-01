'use strict';

var koalas = require('koalas');
var get = require('get-value');
var union = require('union-value');
var extend = require('extend-shallow');
var define = require('define-property');
var typeOf = require('kind-of');
var utils = require('./utils');

/**
 * Create a new `Field` of the given `type` to validate against,
 * and optional `config` object.
 *
 * ```js
 * var field = new Field('string', {
 *   normalize: function(val) {
 *     // do stuff to `val`
 *     return val;
 *   }
 * });
 * ```
 * @param {String|Array} `type` One more JavaScript native types to use for validation.
 * @param {Object} `config`
 * @api public
 */

function Field(types, config, parent) {
  if (typeof types !== 'string' && !Array.isArray(types)) {
    parent = config;
    config = types || {};
    types = config.types;
  }

  if (typeof config === 'function') {
    config = { normalize: config };
  }

  define(this, 'isField', true);
  define(this, 'parent', parent || {});
  define(this, 'config', config || {});
  define(this, 'cache', {});

  this.types = utils.types(types);
}

/**
 * Returns true if the given `val` is a valid type.
 *
 * @param {any} `val`
 * @return {Boolean}
 * @api public
 */

Field.prototype.inspect = function() {
  return '<Field [' + this.types.join('|') + ']>';
};

/**
 * Returns true if the given `val` is a valid type.
 *
 * @param {any} `val`
 * @return {Boolean}
 * @api public
 */

Field.prototype.get = function(prop) {
  return koalas(get(this, prop), get(this.config, prop));
};

/**
 * Returns true if the given `val` is a valid type.
 *
 * @param {any} `val`
 * @return {Boolean}
 * @api public
 */

Field.prototype.isValidType = function(val) {
  return this.types.length ? utils.isValidType(val, this.types) : true;
};

/**
 * Called in `schema.validate`, returns true if the given
 * `value` is valid. This default validate method returns
 * true unless overridden with a custom `validate` method.
 *
 * ```js
 * var field = new Field({
 *   types: ['string']
 * });
 *
 * field.validate('name', {});
 * //=> false
 * ```
 *
 * @return {Boolean}
 * @api public
 */

Field.prototype.validate = function(val/*, key, config, schema*/) {
  if (!this.isValidType(val)) {
    return false;
  }
  if (typeof this.config.validate === 'function') {
    return this.config.validate.apply(this, arguments);
  }
  return true;
};

/**
 * Normalize the field's value.
 *
 * ```js
 * var field = new Field({
 *   types: ['string'],
 *   normalize: function(val, key, config, schema) {
 *     // do stuff to `val`
 *     return val;
 *   }
 * });
 * ```
 * @api public
 */

Field.prototype.normalize = function(val, key, config, schema) {
  if (typeof this.config.normalize === 'function') {
    val = this.config.normalize.apply(this, arguments);
    if (utils.isObject(val) && val.isSchema) {
      var schema = val;
      val = config[key];
      if (!utils.isObject(val)) val = {};
      val = schema.normalize(val);
      if (this.schema) {
        define(schema, 'parent', this.schema);
        union(this.schema, 'warnings', schema.warnings);
        union(this.schema, 'errors', schema.errors);
      }
    }
  }
  this.val = koalas(val, this.get('default'));
  return this.val;
};

/**
 * Getter/setter for storing the native types to validate against.
 *
 * ```js
 * console.log(new Field('string').types); //=> ['string']
 * console.log(new Field('string|array').types); //=> ['string', 'array']
 * console.log(new Field(['string', 'array']).types); //=> ['string', 'array']
 * ```
 * @api public
 */

Object.defineProperty(Field.prototype, 'types', {
  configurable: true,
  enumerable: true,
  set: function(val) {
    union(this, 'cache.types', val);
  },
  get: function() {
    return (this.cache.types || []).sort();
  }
});

/**
 * Getter/setter that ensures that `field.nullable` is a boolean.
 *
 * ```js
 * console.log(new Field('string').nullable); //=> true
 * console.log(new Field('string', {nullable: true}).nullable); //=> true
 * console.log(new Field('string', {nullable: false}).nullable); //=> false
 * console.log(new Field('string', {required: false}).nullable); //=> true
 * console.log(new Field('string', {required: true}).nullable); //=> false
 * ```
 * @api public
 */

Object.defineProperty(Field.prototype, 'nullable', {
  configurable: true,
  enumerable: true,
  set: function(val) {
    define(this.cache, 'nullable', val);
  },
  get: function() {
    if (typeof this.config.nullable === 'boolean') {
      return this.config.nullable;
    }
    return this.config.required !== true;
  }
});

/**
 * Getter/setter that ensures that `field.optional` is a boolean.
 *
 * ```js
 * console.log(new Field('string').optional); //=> true
 * console.log(new Field('string', {optional: true}).optional); //=> true
 * console.log(new Field('string', {optional: false}).optional); //=> false
 * console.log(new Field('string', {required: false}).optional); //=> true
 * console.log(new Field('string', {required: true}).optional); //=> false
 * ```
 * @api public
 */

Object.defineProperty(Field.prototype, 'optional', {
  configurable: true,
  enumerable: true,
  set: function(val) {
    define(this.cache, 'optional', val);
  },
  get: function() {
    if (typeof this.config.optional === 'boolean') {
      return this.config.optional;
    }
    return this.config.required !== true;
  }
});

/**
 * Getter/setter that ensures that `field.required` is a boolean.
 *
 * ```js
 * console.log(new Field('string').required); //=> false
 * console.log(new Field('string', {required: false}).required); //=> false
 * console.log(new Field('string', {required: true}).required); //=> true
 * console.log(new Field('string', {optional: true}).required); //=> false
 * console.log(new Field('string', {optional: false}).required); //=> true
 * ```
 * @api public
 */

Object.defineProperty(Field.prototype, 'required', {
  configurable: true,
  enumerable: true,
  set: function(val) {
    define(this.cache, 'required', val);
  },
  get: function() {
    if (typeof this.cache.required === 'boolean') {
      return this.cache.required;
    }
    if (typeof this.config.required === 'boolean') {
      return this.config.required;
    }
    if (typeof this.config.nullable === 'boolean') {
      return this.config.nullable !== false;
    }
    return this.config.optional === false;
  }
});

Field.isField = function(field) {
  return utils.isObject(field) && field.isField === true;
};

/**
 * Expose `Field`
 */

module.exports = Field;
