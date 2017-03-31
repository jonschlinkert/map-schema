'use strict';

var utils = module.exports = require('lazy-cache')(require);
var warnings = require('./warnings');
var fn = require;
require = utils;

/**
 * Lazily required module dependencies
 */

require('arr-union', 'union');
require('collection-visit', 'visit');
require('define-property', 'define');
require('extend-shallow', 'extend');
require('get-value', 'get');
require('is-primitive');
require('kind-of', 'typeOf');
require('log-utils', 'log');
require('longest');
require('mixin-deep', 'merge');
require('object.omit', 'omit');
require('object.pick', 'pick');
require('omit-empty');
require('pad-right', 'pad');
require('set-value', 'set');
require('sort-object-arrays', 'sortArrays');
require('union-value');
require = fn;

/**
 * Logging colors and symbols
 */

utils.symbol = utils.log.symbols;
utils.color = utils.log.colors;

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

utils.has = function(val, target) {
  switch (utils.typeOf(val)) {
    case 'array':
    case 'string':
      return utils.hasElement(val, target);
    case 'date':
    case 'object':
    case 'regex':
      return utils.hasValue(val, target);
  }
};

/**
 * Returns true if `obj` has property `key`, and its value is
 * not undefind, null or an empty string.
 *
 * @param {any} `val`
 * @return {Boolean}
 */

utils.hasValue = function(key, target) {
  if (!target.hasOwnProperty(key)) {
    return false;
  }
  var val = target[key];
  if (val === false || val === 0) {
    return true;
  }
  return !!val;
};

utils.hasElement = function(key, target) {
  return target === key || target.indexOf(key) !== -1;
};

/**
 * Return true if `val` is empty
 */

utils.isEmptyDeep = function(val) {
  if (Array.isArray(val)) {
    var arr = val.filter(function(ele) {
      return !utils.isEmptyDeep(ele);
    });
    return arr.length === 0;
  }
  if (utils.isObject(val)) {
    var keys = Object.keys(val);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];

      if (!utils.isEmptyDeep(val[key])) {
        return false;
      }
    }
    return true;
  }
  return utils.isEmpty(val);
};

utils.isEmpty = function(val) {
  switch (utils.typeOf(val)) {
    case 'null':
    case 'undefined':
      return true;
    case 'boolean':
      return false;
    case 'string':
    case 'array':
      return val.length > 0;
    case 'number':
      return val > 0;
    case 'error':
      return val.message.length > 0;
    case 'object':
      return Object.keys(val).length > 0;
    case 'file':
    case 'map':
    case 'set':
      return val.size > 0;
    default: {
      return false;
    }
  }
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

/**
 * Return the indefinite article(s) to use for the given
 * JavaScript native type or types.
 *
 * @param {String|Array} `types`
 * @return {String}
 */

utils.article = function(types) {
  if (typeof types === 'string' || types.length === 1) {
    var prefix = /^[aeiou]/.test(String(types)) ? 'an ' : 'a ';
    return prefix + types;
  }

  if (!Array.isArray(types)) {
    throw new TypeError('expected a string or array');
  }

  return types.map(function(type) {
    return utils.article(type);
  }).join(' or ');
};

/**
 * Format a line in the warning table
 */

utils.formatWarning = function(warning) {
  var method = warning.method;
  var msg = utils.log.warning;
  msg += ' ';
  msg += utils.color.yellow('warning');
  msg += ' ';
  if (method === 'custom') {
    msg += warning.message;
  } else {
    msg += warnings[warning.method](warning);
  }
  return msg;
};
