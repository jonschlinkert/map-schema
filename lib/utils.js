'use strict';

const { defineProperty } = Reflect;
const warnings = require('./warnings');

const define = (obj, key, fn) => {
  defineProperty(obj, key, { get: fn });
};

/**
 * Lazily required module dependencies
 */

define(exports, 'union', () => require('arr-union'));
define(exports, 'visit', () => require('collection-visit'));
define(exports, 'define', () => require('define-property'));
define(exports, 'extend', () => require('extend-shallow'));
define(exports, 'get', () => require('get-value'));
define(exports, 'isPrimitive', () => require('is-primitive'));
define(exports, 'typeOf', () => require('kind-of'));
define(exports, 'longest', () => require('longest'));
define(exports, 'merge', () => require('mixin-deep'));
define(exports, 'omit', () => require('object.omit'));
define(exports, 'pick', () => require('object.pick'));
define(exports, 'omitEmpty', () => require('omit-empty'));
define(exports, 'pad', () => require('pad-right'));
define(exports, 'set', () => require('set-value'));
define(exports, 'sortArrays', () => require('sort-object-arrays'));
define(exports, 'unionValue', () => require('union-value'));

/**
 * Return true if `obj` has property `key`, and its value is
 * not undefind, null or an empty string.
 *
 * @param {any} `val`
 * @return {Boolean}
 */

exports.hasValue = (key, target) => {
  if (!target.hasOwnProperty(key)) {
    return false;
  }
  var val = target[key];
  if (typeof val === 'undefined' || val === 'undefined') {
    return false;
  }
  if (val === null || val === '') {
    return false;
  }
  return true;
};

exports.hasElement = (key, target) => {
  if (typeof target === 'string') {
    target = [target];
  }
  return target.indexOf(key) === -1;
};

/**
 * Return true if `val` is empty
 */

exports.isEmpty = val => {
  if (exports.isPrimitive(val)) {
    return val === 0 || val === null || typeof val === 'undefined';
  }
  if (Array.isArray(val)) {
    return val.length === 0;
  }
  if (exports.isObject(val)) {
    return Object.keys(exports.omitEmpty(val)).length === 0;
  }
};

/**
 * Return true if `val` is an object, not an array or function.
 *
 * @param {any} `val`
 * @return {Boolean}
 */

exports.isObject = val => {
  return exports.typeOf(val) === 'object';
};

/**
 * Cast `val` to an array.
 *
 * @param {String|Array} val
 * @return {Array}
 */

exports.arrayify = val => {
  return val ? (Array.isArray(val) ? val : [val]) : [];
};

/**
 * Return the indefinite article(s) to use for the given
 * JavaScript native type or types.
 *
 * @param {String|Array} `types`
 * @return {String}
 */

exports.article = types => {
  if (typeof types === 'string' || types.length === 1) {
    const prefix = /^[aeiou]/.test(String(types)) ? 'an ' : 'a ';
    return prefix + types;
  }
  return types.map(type => exports.article(type)).join(' or ');
};
