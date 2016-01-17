/*!
 * schema <https://github.com/jonschlinkert/schema>
 *
 * Copyright (c) 2016, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var Data = require('./lib/data');
var Field = require('./lib/field');
var utils = require('./lib/utils');

/**
 * Expose `Schema`
 */

module.exports = Schema;

/**
 * Create a new `Schema` with the given `options`.
 *
 * ```js
 * var schema = new Schema()
 *   .field('name', 'string')
 *   .field('version', 'string')
 *   .field('license', 'string')
 *   .field('licenses', {
 *     validate: function(val, key) {
 *       this.error(key, 'licenses is deprecated. use "license" instead.');
 *     }
 *   })
 *   .normalize(require('./package'))
 * ```
 * @param {Object} `options`
 * @api public
 */

function Schema(options) {
  this.isSchema = true;
  this.options = options || {};
  this.data = new Data();

  this.fns = [];
  this.normalizers = {};
  this.validators = {};
  this.defaults = {};
  this.required = [];
  this.fields = {};
  this.remove = [];
  this.errors = [];

  this.addFields(this.options);
}

/**
 * Push an error onto the `schema.errors` array. Placeholder for
 * better error handling and a reporter (planned).
 *
 * @param {String} `method` The name of the method where the error is recorded.
 * @param {String} `prop` The name of the field for which the error is being created.
 * @param {String} `message` The error message.
 * @param {String} `value` The value associated with the error.
 * @return {any}
 * @api public
 */

Schema.prototype.error = function(method, prop, msg, value) {
  var err = { method: method, prop: prop, message: msg, args: value };
  if (typeof value !== 'undefined') {
    err.value = value;
  }
  this.errors.push(err);
  return this;
};

Schema.prototype.normalizer = function(name, fn) {
  utils.unionValue(this.normalizers, name, fn);
  return this;
};

Schema.prototype.validator = function(name, fn) {
  utils.unionValue(this.validators, name, fn);
  return this;
};

/**
 * Add a field to the schema with the given `name`, `type` or types,
 * and options.
 *
 * ```js
 * var semver = require('semver');
 *
 * schema
 *   .field('keywords', 'array')
 *   .field('version', 'string', {
 *     validate: function(val, key, config, schema) {
 *       return semver.valid(val) !== null;
 *     }
 *   })
 * ```
 * @param {String} `name`
 * @param {String|Array} `type`
 * @param {Object} `options`
 * @return {Object} Returns the instance for chaining.
 * @api public
 */

Schema.prototype.field = function(name, type, options) {
  var field = new Field(type, options || {});
  field.name = name;

  if (typeof field.normalize === 'function') {
    this.fns.push(field);
  }
  if (field.hasOwnProperty('default')) {
    this.defaults[name] = field.default;
  }
  if (field.required) {
    this.required.push(name);
  }
  this.fields[name] = field;
  return this;
};

/**
 * Add an object of fields to `schema.fields`. If `options.extend` is true,
 * and a field with the given name already exists, the new field will extend
 * the existing field.
 *
 * @param {Object} `options`
 */

Schema.prototype.addFields = function(options) {
  options = options || {};
  if (options.fields) {
    for (var key in options.fields) {
      var val = options.fields[key];
      if (this.fields[key] && (val.extend || options.extend)) {
        val = utils.merge({}, val, this.fields[key]);
      }
      this.field(key, val);
    }
  }
};

/**
 * Get field `name` from the schema. Get a specific property from
 * the field by passing the property name as a second argument.
 *
 * ```js
 * schema.field('bugs', ['object', 'string']);
 * var field = schema.get('bugs', 'types');
 * //=> ['object', 'string']
 * ```
 * @param {Strign} `name`
 * @param {String} `prop`
 * @return {Object|any} Returns the field instance or the value of `prop` if specified.
 * @api public
 */

Schema.prototype.get = function(name, prop) {
  return utils.get(this.fields, prop ? [name, prop] : name);
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
  this.remove.push(key);
  return this;
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
  if (arguments.length === 2) {
    config = val;
    val = config[key];
  }
  if (typeof val !== 'undefined' && config) {
    config[key] = val;
  }
  this.normalizeField(key, val, config);
  return this;
};

/**
 * Returns true if field `name` is an optional field.
 *
 * @param {String} `name`
 * @return {Boolean}
 * @api public
 */

Schema.prototype.isOptional = function(name) {
  return !!this.get(name, 'optional');
};

/**
 * Returns true if field `name` was defined as a required field.
 *
 * @param {String} `name`
 * @return {Boolean}
 * @api public
 */

Schema.prototype.isRequired = function(name) {
  return !!this.get(name, 'required');
};

/**
 * Run all normalizer functions against the config object.
 *
 * @param {Object} `config`
 * @return {Object} returns the config object
 */

Schema.prototype.runNormalizers = function(config) {
  var len = this.fns.length;
  var idx = -1;
  while (++idx < len) {
    var field = this.fns[idx];
    var key = field.name;

    var fns = utils.arrayify(this.normalizers[key]);
    utils.union(fns, [field.normalize]);

    var val = config[key];
    for (var i = 0; i < fns.length; i++) {
      var fn = fns[i];
      var res = fn.call(this, val, key, config, this);
      if (this.isValidType(key, res, config)) {
        config[key] = res;
      }
    }
  }
  return config;
};

/**
 * When `options.defaults` is true, any default values defined
 * on fields will be set on properties that aren't set or do not
 * have a value already define.
 *
 * We need to loop over the config again, since defaults might
 * be defined for properties that don't exist on the config.
 *
 * @param {Object} `config`
 * @return {Object} returns the config object with defaults defined.
 */

Schema.prototype.setDefaults = function(config) {
  if (this.options.defaults === false) {
    return config;
  }
  for (var key in this.defaults) {
    if (!utils.hasValue(key, config)) {
      config[key] = this.defaults[key];
    }
  }
  return config;
};

/**
 * Checks the config object for missing fields and. If found,
 * an error message is pushed onto the `schema.errors` array,
 * which can be used for reporting.
 *
 * @param {Object} `config`
 * @return {Array}
 * @api public
 */

Schema.prototype.missingFields = function(config) {
  if (this.options.required === false) {
    return false;
  }
  var len = this.required.length, i = -1;
  var res = [];
  while (++i < len) {
    var prop = this.required[i];
    if (!config.hasOwnProperty(prop)) {
      this.error('missingFields', prop, 'required field');
      res.push(prop);
    }
  }
  return res;
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
  keys = keys || this.options.keys;
  if (Array.isArray(keys) && keys.length) {
    keys = utils.union(keys, Object.keys(config));
    var len = keys.length, i = -1;
    var res = {};
    while (++i < len) {
      var key = keys[i];
      if (config.hasOwnProperty(key)) {
        res[key] = config[key];
      }
    }
    return res;
  }
  return config;
};

/**
 * When `options.sortArrays` _is not false_, sorts all arrays in the
 * given `config` object using JavaScript's native `.localeCompare`
 * method.
 *
 * @param {Object} `config`
 * @return {Object} returns the config object with sorted arrays
 * @api public
 */

Schema.prototype.sortArrays = function(config) {
  if (this.options.sortArrays !== false) {
    return utils.sortArrays(config);
  }
  return config;
};

/**
 * Returns true if the given value is valid for field `key`.
 *
 * @param {String} `key`
 * @param {any} `val`
 * @param {Object} `config`
 * @return {Boolean}
 * @api public
 */

Schema.prototype.isValidType = function(key, val, config) {
  config = config || {};
  var field = this.get(key);
  if (typeof field === 'undefined') {
    if (this.options.knownOnly) {
      this.error('isValidType', key, 'unknown field');
      return false;
    }
    return true;
  }

  if (field.isValidType(val, key, config, this)) {
    return true;
  }

  if (config.hasOwnProperty(key) || typeof field.normalize === 'function') {
    var types = this.get(key, 'types');
    var args = JSON.stringify(val);
    var msg = 'expected "' + key + '" to be ' + utils.article(types);
    this.error('isValidType', key, msg, args);
  }
  return false;
};

/**
 * Iterate over the given `config` and validate any properties
 * that have a `field` with a `validate` function on the schema.
 *
 * @param {Object} `config`
 * @return {Object}
 */

Schema.prototype.validate = function(config) {
  if (!utils.isObject(config)) {
    throw new TypeError('expected config to be an object');
  }
  for (var key in config) {
    this.validateField(config[key], key, config);
  }
  return this.errors;
};

/**
 * Validate a single property on the config.
 *
 * @param {any} `val`
 * @param {String} `key`
 * @param {Object} `config`
 * @return {undefined}
 */

Schema.prototype.validateField = function(val, key, config) {
  var field = this.fields[key];
  if (!utils.isObject(field)) {
    this.error('validateField', key, 'field is not defined');
  }

  this.isValidType(key, val, config);

  if (typeof field.validate === 'function') {
    var isValid = field.validate(val, key, config, this);
    if (!isValid) {
      this.error('validateField', key, 'invalid value', val);
    }
  }
};

/**
 * Normalize the given `config` object.
 *
 * @param {String} key
 * @param {any} value
 * @param {Object} config
 * @return {Object}
 * @api public
 */

Schema.prototype.normalize = function(config, options) {
  if (utils.typeOf(config) !== 'object') {
    throw new TypeError('expected config to be an object');
  }

  options = options || {};
  this.addFields(options);

  for (var key in config) {
    this.normalizeField.call(this, key, config[key], config);
  }

  // set defaults and call normalizers
  config = this.runNormalizers(config);
  config = this.setDefaults(config);

  // check for missing required fields
  this.missingFields(config);

  // sort object and arrays
  config = this.sortObject(config);
  config = this.sortArrays(config);

  // remove empty objects if specified on options
  if (this.options.omitEmpty) {
    config = utils.omitEmpty(config);
  }
  return config;
};

/**
 * Normalize a field on the schema.
 *
 * @param {String} key
 * @param {any} value
 * @param {Object} config
 * @return {Object}
 * @api public
 */

Schema.prototype.normalizeField = function(key, value, config) {
  if (!this.fields.hasOwnProperty(key)) {
    this.removeKey(key, config);
    return;
  }

  var field = this.fields[key];
  var val = config[key];

  if (utils.isObject(field)) {
    if (typeof field.normalize === 'function' && !this.options.validate) {
      if (field.isSchema && field.errors.length) {
        utils.union(this.errors, field.errors);
      }

      val = field.normalize.call(this, val, key, config, this);
      if (typeof val !== 'undefined') {
        config[key] = val;
      }
      if (this.removeKey(key, config)) {
        return;
      }
    }

    var isValidType = this.isValidType(key, val, config);
    if (isValidType === false) {
      return;
    }

    if (typeof field.validate === 'function' && !this.options.normalize) {
      if (!this.validateField(val, key, config)) return;
    }
  } else {
    this.isValidType(key, val, config);
  }

  this.removeKey(key, config);
};

/**
 * Visit `method` over the given object or array.
 *
 * @param {String} `method`
 * @param {Object|Array} `value`
 * @return {Object} Returns the instance for chaining.
 * @api public
 */

Schema.prototype.visit = function(method, value) {
  utils.visit(this, method, value);
  return this;
};

/**
 * Remove `key` from the `config` object.
 *
 * @param {String} key
 * @param {Object} config
 * @return {undefined} The object is modified in place
 */

Schema.prototype.removeKey = function(key, config) {
  if (this.remove.indexOf(key) !== -1) {
    delete this.defaults[key];
    delete config[key];
    return true;
  }
};

/**
 * Log warnings and errors that were recorded during normalization.
 *
 * This is a placeholder for a reporter (planned)
 *
 * @return {String}
 */

Schema.prototype.logErrors = function() {
  var msg = 'Field\t| Message';
  this.errors.forEach(function(err) {
    msg += '\n' + err.field + '\t| ' + err.msg;
  });
  console.log(msg);
};