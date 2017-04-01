'use strict';

var utils = module.exports;

/**
 * Module dependencies
 */

utils.define = require('define-property');
utils.extend = require('extend-shallow');
utils.get = require('get-value');
utils.isPrimitive = require('is-primitive');
utils.merge = require('mixin-deep');
utils.omit = require('object.omit');
utils.omitEmpty = require('omit-empty');
utils.pick = require('object.pick');
utils.set = require('set-value');
utils.sortArrays = require('sort-object-arrays');
utils.typeOf = require('kind-of');
utils.union = require('arr-union');
utils.unionValue = require('union-value');

/**
 * Normalize and reduce the given string or array of
 * `types` to an array of lowercase types.
 */

utils.types = function(types, options) {
  var opts = utils.extend({}, options);
  var arr = [];

  types = utils.union([], types, opts.types);
  for (var i = 0; i < types.length; i++) {
    var type = types[i];
    if (typeof type !== 'string') {
      throw new TypeError('expected type to be a string');
    }
    var segs = type.split('|');
    if (segs.length > 1) {
      arr = arr.concat(utils.types(segs));
    } else {
      arr.push(type.toLowerCase().trim());
    }
  }
  return arr;
};

/**
 * Returns true if typeof `val` is a valid type.
 *
 * @param {any} `val`
 * @param {Array|String} `types` One or more types.
 * @return {Boolean}
 */

utils.isValidType = function(val, types) {
  return utils.types(types).indexOf(utils.typeOf(val)) !== -1;
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
 */

utils.sortObject = function(config, keys) {
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

/**
 * Return true if `val` is an object, not an array or function.
 *
 * @param {any} `val`
 * @return {Boolean}
 */

utils.isObject = function(val) {
  return utils.typeOf(val) === 'object';
};

/**
 * Cast `val` to an array.
 *
 * @param {String|Array} val
 * @return {Array}
 */

utils.arrayify = function(val) {
  return val ? (Array.isArray(val) ? val : [val]) : [];
};
