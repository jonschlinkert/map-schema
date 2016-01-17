'use strict';

var utils = require('./utils');

module.exports = toSchema;

function toSchema(config) {
  if (!utils.isObject(config)) {
    throw new TypeError('expected config to be an object');
  }

  var schema = {fields: {}, keys: []};
  for (var key in config) {
    if (config.hasOwnProperty(key)) {
      var val = config[key];
      schema.keys.push(key);
      schema.fields[key] = {
        type: utils.typeOf(val),
        default: val
      };
    }
  }
  return schema;
}
