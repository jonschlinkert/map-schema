/*!
 * map-schema <https://github.com/jonschlinkert/map-schema>
 *
 * Copyright (c) 2016, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var util = require('util');
var omitEmpty = require('omit-empty');
var omit = require('object.omit');
var pick = require('object.pick');
var get = require('get-value');
var typeOf = require('kind-of');
var isObject = require('isobject');
var extend = require('extend-shallow');
var define = require('define-property');
var Emitter = require('component-emitter');
var debug = require('debug')('map-schema');
var union = require('union-value');
var Base = require('base');
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
  this.fields = {};
  this.cache = {
    missing: [],
    omit: [],
    pick: []
  };

  if (utils.isObject(this.options.fields)) {
    this.addFields(this.options.fields);
  }
}

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
  var existing = this.fields[key];
  if (Field.isField(existing) && field.get('extend') === true) {
    field = utils.merge({}, existing, field);
  }

  if (schema) {
    var normalize = field.normalize;
    field.normalize = function() {
      var val = schema.normalize.apply(schema, arguments);
      field.val = val;
      return val;
    };
  }

  if (field.required) union(this, 'cache.required', key);
  if (field.optional) union(this, 'cache.optional', key);
  if (field.nullable) union(this, 'cache.nullable', key);

  field.key = key;
  this.fields[key] = field;
  return this;
};

/**
 * Field
 */

Schema.prototype.set = function(prop, val) {
  set(this, prop, val);
  return tihs;
};

/**
 * Field
 */

Schema.prototype.get = function(key, prop) {
  var field = get(this.fields, key);
  if (typeof prop === 'string') {
    return field.get(prop);
  }
  return field;
};

Schema.prototype.mergeOptions = function(options) {
  var opts = extend({}, this.options);
  if (!options) return opts;

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
 * Omit a property from the returned object. This method can be used
 * in normalize functions as a way of removing undesired properties.
 *
 * @param {String} `key` The property to remove
 * @return {Object} Returns the instance for chaining.
 * @api public
 */

Schema.prototype.omit = function(key) {
  union(this, 'cache.omit', key);
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
      var key = keys[i];
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
 * Returns true if field `name` is an optional field.
 *
 * @param {String} `name`
 * @return {Boolean}
 * @api public
 */

Schema.prototype.isOptional = function(name) {
  return this.get(name, 'optional');
};

/**
 * Returns true if field `name` was defined as a required field.
 *
 * @param {String} `name`
 * @return {Boolean}
 * @api public
 */

Schema.prototype.isRequired = function(name) {
  return this.get(name, 'required');
};

/**
 * Returns true if field `name` was defined as a nullable field.
 *
 * @param {String} `name`
 * @return {Boolean}
 * @api public
 */

Schema.prototype.isNullable = function(name) {
  return this.get(name, 'nullable');
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
    field = this.fields[field];
  }

  if (!Field.isField(field)) {
    throw new Error('expected an instance of Field');
  }

  return field.isValidType(val);
};

/**
 * Add an object of fields to `schema.fields`. If `options.extend` is true,
 * and a field with the given name already exists, the new field will extend
 * the existing field.
 *
 * @param {Object} `options`
 */

Schema.prototype.addFields = function(fields) {
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

Schema.prototype.validateField = function(field) {
  if (!Field.isField(field)) {
    throw new Error('expected an instance of Field');
  }

  if (field.required && typeof field.val === 'undefined') {
    this.error('required', field);
    this.missing(field.key);
    return;
  }

  if (!field.validate(field.val)) {
    this.error('invalid', field);
    return;
  }
};

/**
 * Normalize
 */

Schema.prototype.normalize = function(config, options) {
  if (!utils.isObject(config)) {
    throw new TypeError('expected config to be an object');
  }
  var opts = this.mergeOptions(options);
  var keys = Object.keys(this.fields);
  this.config = config;

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];

    if (opts.existingOnly === true && !this.config.hasOwnProperty(key)) {
      continue;
    }

    this.validateField(this.normalizeField(key));
  }

  if (this.cache.omit.length) {
    this.config = omit(this.config, this.cache.omit);
  }

  if (this.cache.pick.length) {
    this.config = pick(this.config, this.cache.pick);
  }

  if (opts.omitEmpty === true) {
    this.config = omitEmpty(this.config);
  }

  if (opts.sortArrays === true) {
    this.config = utils.sortArrays(this.config);
  }

  if (Array.isArray(opts.sortBy)) {
    this.config = this.sortObject(this.config, opts.sortBy);
  }
  return this.config;
};

Schema.prototype.normalizeField = function(key, val) {
  var field = this.fields[key];
  var config = this.config;
  if (typeof val === 'undefined') {
    val = config[key];
  }
  field.normalize(val, key, config, this);
  this.config[key] = field.val;
  return field;
};

/**
 * Update a property on the returned object. This method will trigger validation
 * and normalization of the updated property.
 *
 * @param {String} `key` The property to update.
 * @param {*} `val` Value of the property to update.
 * @return {Object} Returns the instance for chaining.
 * @api public
 */

Schema.prototype.update = function(key, val, config) {
  this.normalizeField.apply(this, arguments);
  return this;
};

/**
 * If a `keys` array is passed on the constructor options, or
 * as a second argument to `sortObject`, this sorts the given
 * object so that keys are in the same order as the supplied
 * array of `keys`.
 *
 * ```js
 * schema.sortObject({z: '', a: ''}, ['a', 'z']);
 * //=> {a: '', z: ''}
 * ```
 * @param {Object} `config`
 * @return {Object} Returns the config object with keys sorted to match the given array of keys.
 * @api public
 */

Schema.prototype.sortObject = function(config, keys) {
  if (Array.isArray(keys) && keys.length) {
    keys = utils.union([], keys, Object.keys(config));

    var len = keys.length;
    var idx = -1;
    var res = {};

    while (++idx < len) {
      var key = keys[idx];
      if (config.hasOwnProperty(key)) {
        res[key] = config[key];
      }
    }
    return res;
  }
  return config;
};

// Schema.prototype.run = function(val) {
//   return this.validate(this.normalize(val));
// };

Schema.prototype.error = function(message, field) {
  if (this.options.strict !== true) {
    return this.warn.apply(this, arguments);
  }
  this.errors.push({message: message, field: field});
  return this;
};

Schema.prototype.warn = function(message, field) {
  this.warnings.push({message: message, field: field});
  return this;
};

Schema.isSchema = function(val) {
  return isObject(val) && val.isSchema === true;
};

/**
 * Expose `Schema`
 */

module.exports = Schema;

// var foo = new Schema()
//   .field('a', {default: 'aaa'})
//   .field('b', {default: 'bbb'})
//   .field('c', {default: 'ccc'})

// var bar = new Schema()
//   .field('d', {default: 'ddd'})
//   .field('e', {default: 'eee'})
//   .field('f', {default: 'fff'})

// var sub = new Schema()
//   .field('x', {default: 'xxx'})
//   .field('y', {default: 'yyy'})
//   .field('z', {
//     normalize: function(val) {
//       console.log(arguments)
//       return val || 'zzz'
//     }
//   })

// var baz = new Schema()
//   .field('g', {default: 'ggg'})
//   .field('h', {default: 'hhh'})
//   .field('i', sub)

// var config = {baz: {i: {z: null}}};
// var schema = new Schema()
//   .field('foo', foo)
//   .field('bar', bar)
//   .field('baz', baz)
//   .field('qux', function() {
//     return 'zzz';
//   })
//   .normalize(config)


// console.log(config)
