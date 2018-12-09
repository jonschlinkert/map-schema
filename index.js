'use strict';

const { struct } = require('superstruct');
const typeOf = require('kind-of');
const mixin = require('mixin-deep');
const isObject = val => typeOf(val) === 'object';

class Field {
  constructor(name, options = {}) {
    if (typeof name !== 'string') {
      options = name;
      name = void 0;
    }

    if (typeOf(options) !== 'object') {
      options = { schema: options };
    }

    this.name = name;
    this.options = options;
    this.default = options.default;
    this.required = options.required;
    this.schema = options.schema || 'any';
    this.format = options.format || (value => value);
    this.parse = options.parse || (value => value);

    if (Array.isArray(this.schema)) this.schema = this.schema.join('|');
    this.struct = struct(this.schema);

    if (typeof this.required !== 'boolean') {
      if (typeof this.schema === 'string') {
        this.required = !this.schema.includes('?');
      } else {
        this.required = false;
      }
    }
  }

  validate(value, schema) {
    let validate = this.options.validate;
    let error = this.struct.validate(value);

    if (error && error[0]) {
      this.error = error[0];
      return false;
    }

    if (typeof validate === 'function') {
      let isValid = validate.call(this, value, schema);
      if (isValid instanceof Error) {
        this.error = isValid;
        return false;
      }
      return isValid;
    }

    return true;
  }
}

class MapSchema {
  constructor(options = {}) {
    this.options = options;
    this.values = { ...options.values };
    this.state = { errors: new Map(), missing: [], custom: [], omitted: [] };
    this.fields = new Map();

    if (isObject(this.options.fields)) {
      for (let key of Object.keys(this.options.fields)) {
        this.field(key, this.options.fields[key]);
      }
    }
  }

  field(name, options) {
    if (options === void 0) return this.fields.get(name);
    if (Array.isArray(options)) options = options.join('|');
    if (typeof options === 'string') options = { schema: options };
    if (this.isSchema(options)) {
      this.fields.set(name, options);
      return this;
    }
    let opts = this.isSchema(options) ? options : { ...this.options, ...options };
    this.fields.set(name, new Field(name, opts));
    return this;
  }

  parse(values = {}) {
    let opts = { ...this.options };

    if (opts.validateKeys === true) {
      let fields = [...this.fields.keys()];
      let keys = Object.keys(values);
      this.state.custom = keys.filter(k => !this.fields.has(k));
      this.state.missing = fields.filter(k => !keys.includes(k));
    }

    for (let [key, field] of this.fields) {
      let value = [values[key], field.default, this.values[key]].find(v => v !== void 0);

      if (field.validate(value, opts) === false) {
        this.state.errors.set(key, field.error);
        continue;
      }

      field.value = value;
      field.parsed = field.parse(value);
      let val = merge(this.values[key], field.parsed);
      if (val !== void 0) {
        this.values[key] = val;
      }

      if (!this.values.hasOwnProperty(key) && field.required === true) {
        this.state.missing.push(key);
        continue;
      }
    }
    return this;
  }

  format(values, options = {}) {
    if (!isObject(values)) throw new TypeError('Expected an object');
    let opts = { ...this.options, ...options };
    let data = { ...this.values, ...values };
    let { only = [], omit = [] } = opts;

    let formatted = new Set();
    let result = {};

    let formatValue = key => {
      if (omit.includes(key) || (only.length > 0 && !only.includes(key))) {
        this.state.omitted.push(key);
      } else {
        let d = { ...data };
        let field = this.fields.get(key);
        if (typeof field === 'function') {

        }

        let value = this.formatValue(key, d, options);
        if (value === void 0 && field && field.required === true) {
          let err = new Error(`Field "${key}" is undefined but is required.`);
          this.handleError(key, err, opts.strict);
        }
        if (value !== void 0) {
          result[key] = value;
        }
      }
    };

    // iterate over schema fields first
    for (let [key, field] of this.fields) {
      formatted.add(key);
      formatValue(key);
    }

    // next, iterate over custom properties
    for (let key of Object.keys(data)) {
      if (!formatted.has(key)) {
        formatValue(key);
      }
    }

    if (isObject(result) && opts.sortBy) {
      return this.sortObject(result, opts.sortBy);
    }
    return result;
  }

  formatValue(key, values, options) {
    let field = this.field(key);
    let opts = { ...this.options, ...options };

    if (field === void 0) {
      this.handleError(key, new Error(`A struct for "${key}" has not been defined`));
    }

    try {
      let isValue = this.isValue.bind(this);
      let value = field ? field.format(values[key], values, this) : values[key];
      let result = field ? [value, field.default].find(isValue) : value;
      if (Array.isArray(result) && opts.sortArrays) {
        return this.sortArray(result, opts.sortArrays);
      }
      return result;
    } catch (err) {
      this.handleError(key, err);
    }
  }

  sortArray(arr, fn) {
    if (typeof fn === 'function') {
      return fn.call(this, arr.slice());
    }
    return arr.slice().sort();
  }

  sortObject(obj, keys = []) {
    if (typeof keys === 'function') {
      return keys.call(this, obj);
    }
    return sortObject(obj, keys);
  }

  isValue(value) {
    if (typeof this.options.isValue === 'function') {
      return this.options.isValue(value);
    }
    return value !== void 0;
  }

  validateKeys(values, strict) {
    let keys = Object.keys(values);
    let required = keys.filter(key => !this.fields.has(key));
    for (let key of required) {
      let err = new Error('Expected a schema to be defined for: ' + key);
      this.handleError(key, err, strict);
    }
    return this;
  }

  validate(values, strict = this.options.strict) {
    for (let key of Object.keys(values)) {
      let field = this.field(key);
      let result = field.validate(values[key]);
      let err = result[0];
      if (err) {
        this.handleError(key, err, strict);
      }
    }
    return this.state.errors;
  }

  handleError(key, err, strict = this.options.strict) {
    if (strict === true) throw err;
    this.state.errors.set(key, err);
    return this;
  }

  isSchema(value) {
    return this.constructor.isSchema(value);
  }

  static isSchema(value) {
    return value instanceof this;
  }

  static get Field() {
    return Field;
  }
}

function sortObject(obj, keys = []) {
  let names = union([].concat(keys || []), Object.keys(obj));
  let result = {};

  for (let key of names) {
    if (obj.hasOwnProperty(key)) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Flatten and uniquify an array
 */

function union(...args) {
  return unique(flatten(...args));
}

/**
 * Return an array with unique elements.
 */

function unique(arr = []) {
  return arr.filter((v, i) => arr.indexOf(v) === i);
}

/**
 * Flatten an array
 */

function flatten(...args) {
  let res = [];
  let flat = arr => {
    for (let ele of arr) {
      if (ele !== void 0) {
        Array.isArray(ele) ? flat(ele, res) : res.push(ele);
      }
    }
  };
  flat(args);
  return res;
}

function formatErrors(schema, errors = []) {
  let result = [];
  for (let err of [...errors]) {
    let key = err.path.join('.');
    let field = schema.fields.get(key);
    result.push({ key, value: err.value, field });
  }
  return result;
}

function merge(existing, value) {
  if (!isObject(existing) && existing != null) {
    return existing;
  }
  if (existing !== void 0) {
    return mixin({}, existing, value);
  }
  return value;
}

module.exports = MapSchema;
