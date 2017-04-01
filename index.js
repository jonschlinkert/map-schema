/*!
 * map-schema <https://github.com/jonschlinkert/map-schema>
 *
 * Copyright (c) 2016, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var omitEmpty = require('omit-empty');
var omit = require('object.omit');
var pick = require('object.pick');
var get = require('get-value');
var isObject = require('isobject');
var extend = require('extend-shallow');
var define = require('define-property');
var Emitter = require('component-emitter');
var union = require('union-value');
var Data = require('./lib/data');
var Field = require('./lib/field');
var utils = require('./lib/utils');

/**
 * Create a new `Schema` with the given `options`.
 *
 * ```js
 * var schema = new Schema()
 *   .field('name', 'string')
 *   .field('version', 'string')
 *   .field('license', 'string')
 *   .field('licenses', 'array', {
 *     normalize: function(val, key, config) {
 *        // convert license array to `license` string
 *        config.license = val[0].type;
 *        delete config[key];
 *     }
 *   })
 *   .normalize(require('./package'))
 * ```
 * @param {Object} `options`
 * @api public
 */

function Schema(options, parent) {
  if (utils.isObject(options) && options.isSchema) {
    parent = options;
    options = {};
  }

  if (Schema.isSchema(options)) {
    define(options, 'parent', this);
    return options;
  }

  define(this, 'isSchema', true);
  define(this, 'parent', parent);
  this.data = new Data();
  this.options = this.mergeOptions(options);
  this.warnings = [];
  this.errors = [];
  this.cache = {
    fields: {},
    missing: [],
    unknown: [],
    omit: [],
    pick: []
  };

  if (utils.isObject(this.options.fields)) {
    this.fields(this.options.fields);
  }
}

/**
 * Inherit Emitter
 */

Schema.prototype = Object.create(Emitter.prototype);
Schema.prototype.constructor = Schema;

/**
 * Merge the given `options` object with `schema.options`.
 * @param {Object} options
 * @return {Object}
 */

Schema.prototype.mergeOptions = function(options) {
  var opts = extend({}, this.options);
  if (!options) return opts;
  if (Array.isArray(options)) {
    options = { sortBy: options };
  }

  var keys = Object.keys(options);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var val = options[key];

    switch (key) {
      case 'omit':
        union(this.cache, 'omit', val);
        break;
      case 'only':
      case 'pick':
        union(this.cache, 'pick', val);
        break;
      default: {
        opts[key] = val;
      }
    }
  }

  return opts;
};

/**
 * Set `key` on the instance with the given `value`.
 *
 * @param {String} `key`
 * @param {Object} `value`
 * @api public
 */

Schema.prototype.set = function(key, value) {
  utils.set(this, key, value);
  return this;
};

/**
 * Get field `key` from the schema. If a property name is
 * passed as the second argument, the respective value
 * from the field is returned.
 *
 * ```js
 * schema.field('bugs', 'object|string');
 * var field = schema.get('bugs', 'types');
 * //=> ['object', 'string']
 * ```
 * @param {String} `key` The key of the field to get
 * @param {String=} `prop` Property name
 * @return {Object|any} Returns the field instance or, if specified, the value of `prop`.
 * @api public
 */

Schema.prototype.get = function(key, prop) {
  var field = get(this.cache.fields, key);
  if (typeof prop === 'string') {
    return field.get(prop);
  }
  return field;
};

/**
 * Omit one or more properties from the returned config object.
 * This method can be used in normalize functions as a way of
 * removing undesired properties.
 *
 * @param {Array|String|Object} `val` Key(s) to push onto `cache.omit`, or a config object to omit keys from.
 * @param {Array|String=} `keys` Optionally pass one or more keys to omit when `val` is an object.
 * @return {Object} Returns the instance for chaining.
 * @api public
 */

Schema.prototype.omit = function(val, keys) {
  if (!utils.isObject(val)) {
    union(this, 'cache.omit', val);
    return this;
  }

  keys = utils.arrayify(keys || this.cache.omit);
  return keys.length ? omit(val, keys) : val;
};

/**
 * Field
 */

Schema.prototype.field = function(key, types, options) {
  if (typeof types !== 'string' && !Array.isArray(types)) {
    options = types;
    types = [];
  }

  var schema = null;
  if (Schema.isSchema(options)) {
    schema = options;
    options = {};
  }

  var field = new Field(types, options, this);
  var existing = this.get(key);

  if (Field.isField(existing) && field.get('extend') === true) {
    field = utils.merge({}, existing, field);
  }

  if (schema) {
    var normalize = field.normalize;
    var parent = this;
    define(schema, 'parent', this);
    field.normalize = function() {
      var val = schema.normalize.apply(schema, arguments);
      union(parent, 'warnings', schema.warnings);
      union(parent, 'errors', schema.errors);
      var args = [].slice.call(arguments, 1);
      args.unshift(val);
      return normalize.apply(field, args);
    };
  }

  if (field.required) union(this, 'cache.required', key);
  if (field.optional) union(this, 'cache.optional', key);
  if (field.nullable) union(this, 'cache.nullable', key);

  field.key = key;
  define(field, 'schema', this);
  this.cache.fields[key] = field;
  return this;
};

/**
 * Add an object of fields to `schema.fields`. If `options.extend` is true,
 * and a field with the given name already exists, the new field will extend
 * the existing field.
 *
 * @param {Object} `options`
 */

Schema.prototype.fields = function(fields) {
  if (!utils.isObject(fields)) {
    throw new TypeError('expected fields to be an object');
  }
  var keys = Object.keys(fields);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    this.field(key, fields[key]);
  }
  return this;
};

/**
 * Omit a property from the returned object. This method can be used
 * in normalize functions as a way of removing undesired properties.
 *
 * @param {String} `key` The property to remove
 * @return {Object} Returns the instance for chaining.
 * @api public
 */

Schema.prototype.missing = function(key) {
  if (utils.isObject(key)) {
    var keys = this.cache.required || [];
    var config = key;

    for (var i = 0; i < keys.length; i++) {
      key = keys[i];
      if (typeof config[key] === 'undefined') {
        union(this, 'cache.missing', key);
      }
    }
  } else {
    union(this, 'cache.missing', key);
  }
  return this.cache.missing;
};

/**
 * Omit a property from the returned object. This method can be used
 * in normalize functions as a way of removing undesired properties.
 *
 * @param {String} `key` The property to remove
 * @return {Object} Returns the instance for chaining.
 * @api public
 */

Schema.prototype.unknown = function(key) {
  if (utils.isObject(key)) {
    var keys = this.cache.required || [];
    var config = key;

    for (var i = 0; i < keys.length; i++) {
      key = keys[i];
      if (typeof config[key] === 'undefined') {
        union(this, 'cache.unknown', key);
      }
    }
  } else {
    union(this, 'cache.unknown', key);
  }
  return this.cache.unknown;
};

/**
 * Returns true if field `key` was defined as an optional field.
 *
 * @param {String} `key`
 * @return {Boolean}
 * @api public
 */

Schema.prototype.isOptional = function(key) {
  return this.get(key, 'optional');
};

/**
 * Returns true if field `key` was defined as a required field.
 *
 * @param {String} `key`
 * @return {Boolean}
 * @api public
 */

Schema.prototype.isRequired = function(key) {
  return this.get(key, 'required');
};

/**
 * Returns true if field `key` was defined as a nullable field.
 *
 * @param {String} `key`
 * @return {Boolean}
 * @api public
 */

Schema.prototype.isNullable = function(key) {
  return this.get(key, 'nullable');
};

/**
 * Returns true if field `key` should be omitted from the normalized
 * config object.
 *
 * @param {String} `key`
 * @return {Boolean}
 * @api public
 */

Schema.prototype.isOmitted = function(key) {
  return this.cache.omit.indexOf(key) !== -1;
};

/**
 * Returns true if `field.isValidType()` returns true for the given `val`.
 *
 * @param {String|Object} `field` Field object, or key of a registered field.
 * @return {Boolean}
 * @api public
 */

Schema.prototype.isValidType = function(field, val) {
  if (typeof field === 'string') {
    field = this.cache.fields[field];
  }

  if (!Field.isField(field)) {
    throw new Error('expected an instance of Field');
  }

  return field.isValidType(val);
};

/**
 * Normalize the given `config` object by iterating over registered
 * fields and calling `field.normalize()` on each respective property.
 *
 * @param {Object} `config`
 * @param {Object} `options`
 * @return {Object}
 * @api public
 */

Schema.prototype.normalize = function(config, options) {
  if (typeof this.options.normalize === 'function') {
    config = this.options.normalize.apply(this, arguments);
    if (!utils.isObject(config)) {
      return config;
    }
  }

  if (!utils.isObject(config)) {
    if (!this.parent) {
      throw new TypeError('expected config to be an object');
    }
    config = {};
  }

  var opts = this.mergeOptions(options);
  this.config = config;

  var keys = opts.existingOnly === true
    ? Object.keys(this.config)
    : Object.keys(this.cache.fields);

  for (var i = 0; i < keys.length; i++) {
    this.validateField(this.normalizeField(keys[i]));
  }

  return this.postprocess(this.config, opts);
};

/**
 * Gets field `key` from the schema and calls the field's `.normalize` method
 * on the given `value`.
 *
 * @param {String} `key` The key of the field to get from the schema
 * @param {any} `value` If undefined, `schema.config[key]` will be used.
 * @return {Object}
 * @api public
 */

Schema.prototype.normalizeField = function(key, val) {
  var field = this.cache.fields[key];
  this.config = this.config || {};
  var config = this.config;

  if (typeof val === 'undefined') {
    val = config[key];
  }

  field.normalize(val, key, config, this);
  if (field.val == null) {
    delete this.config[key];
  } else {
    this.config[key] = field.val;
  }
  return field;
};

Schema.prototype.validateField = function(field) {
  if (!Field.isField(field)) {
    throw new Error('expected an instance of Field');
  }

  if (this.options.knownOnly && !this.config.hasOwnProperty(field.key)) {
    this.error('unknown', field);
    this.unknown(field.key);
  }

  if (field.required && typeof field.val === 'undefined') {
    this.error('required', field);
    this.missing(field.key);
  }

  if (!field.validate(field.val)) {
    this.error('invalid', field);
  }

  return field;
};

Schema.prototype.postprocess = function(config, options) {
  if (this.cache.omit.length) {
    config = this.omit(config);
  }

  if (this.cache.pick.length) {
    config = pick(config, this.cache.pick);
  }

  if (utils.isObject(options)) {
    if (options.omitEmpty === true) {
      config = omitEmpty(config);
    }

    if (options.sortArrays === true) {
      config = utils.sortArrays(config);
    }

    if (Array.isArray(options.sortBy)) {
      config = utils.sortObject(config, options.sortBy);
    }
  }
  return config;
};

/**
 * Semantic alias for [.normalizeField](#normalizeField), for usage
 * inside normalize functions.
 *
 * @param {String} `key` The property to update.
 * @param {any} `val` Value of the property to update.
 * @param {Config} `val` Value of the property to update.
 * @return {Object} Returns the instance for chaining.
 * @api public
 */

Schema.prototype.update = function() {
  this.normalizeField.apply(this, arguments);
  return this;
};

Schema.prototype.error = function(message, field) {
  if (this.options.strict !== true) {
    return this.warn.apply(this, arguments);
  }
  if (!this.isOmitted(field.key)) {
    this.errors.push({message: message, field: field});
  }
  return this;
};

Schema.prototype.warn = function(message, field) {
  if (!this.isOmitted(field.key)) {
    this.warnings.push({message: message, field: field});
  }
  return this;
};

Schema.isSchema = function(val) {
  return isObject(val) && val.isSchema === true;
};

/**
 * Expose `Schema`
 */

module.exports = Schema;
