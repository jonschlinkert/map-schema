'use strict';

const { struct } = require('superstruct');
const typeOf = require('kind-of');
const mixin = require('mixin-deep');

class Field {
  constructor(name, options = {}) {
    if (typeOf(options) !== 'object') {
      options = { schema: options };
    }

    this.name = name;
    this.options = options;
    this.default = options.default;
    this.schema = options.schema || 'any';
    this.required = options.required;
    this.format = options.format || ((values = {}) => values[name]);
    this.parse = options.parse || (value => value);
    this.struct = struct(this.schema);

    if (typeof this.required !== 'boolean') {
      this.required = this.schema.slice(-1) !== '?';
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
    this.fields = new Map();
    this.state = { errors: new Map(), missing: [], custom: [] };
    this.values = { ...options.values };
  }

  field(name, options) {
    if (options === void 0) return this.fields.get(name);
    this.fields.set(name, new Field(name, options));
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

    // console.log(this.state)
    // for (let key of Object.keys(values)) {
    //   let field = this.field(key);
    // // console.log(field.struct.validate(values[key]));
    //   // console.log(values[key])
    //   // let errors = Struct.validate(values);
    //   // console.log(errors)

    //   if (field === void 0) {
    //     this.handleError(key, new Error(`Field: "${key}" is not defined`));
    //   }

    //   // try {
    //   //   let value = values[key];
    //   //   if (validate) field.validate(value);
    //   //   field.value = value;
    //   //   field.parsed = field.parse.call(this, value);
    //   //   this.values[key] = merge(this.values[key], field.parsed);
    //   // } catch (err) {
    //   //   this.handleError(key, err);
    //   // }
    // }
    // console.log(this.values);
    return this;
  }

  format(locals) {
    let merge = (key, locals) => mixin({}, this.values, locals);
    let values = {};

    for (let [key] of this.fields) {
      let field = this.field(key);
      if (field === void 0) {
        this.handleError(key, new Error(`Field: "${key}" is not defined`));
      }

      if (typeof field.format !== 'function') {
        continue;
      }

      try {
        let value = merge(key, locals);
        values[key] = field.format(value, this);
      } catch (err) {
        this.handleError(key, err);
      }
    }

    return values;
  }

  validateKeys(values) {
    let keys = Object.keys(values);
    let required = keys.filter(key => !this.fields.has(key));
    if (required.length) {
      throw new Error('Expected a schema to be defined for: ' + required.join(', '));
    }
  }

  validate(values, strict = this.options.strict) {
    let errors = new Map();
    for (let key of Object.keys(values)) {
      let schema = this.field(key);
      let result = schema.validate(values[key]);
      let error = result[0];
      if (error) {
        if (strict) throw error;
        errors.set(key, error);
      }
    }
    return errors;
  }

  handleError(key, err) {
    if (this.options.strict === true) throw err;
    this.state.errors.set(key, err.message);
    return this;
  }

  static get Field() {
    return Field;
  }
}

function formatErrors(schema, errors = []) {
  let result = [];
  for (let err of errors) {
    let key = err.path.join('.');
    let field = schema.fields.get(key);
    result.push({ key, value: err.value, field });
  }
  return result;
}

function isObject(val) {
  return typeOf(val) === 'object';
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
