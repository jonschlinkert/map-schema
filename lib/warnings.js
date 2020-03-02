'use strict';

const util = require('util');
const utils = require('./utils');

module.exports = {
  missing(warning) {
    return 'Required field "' + warning.prop + '" is missing';
  },
  deprecated(warning) {
    let msg = warning.message;
    return 'property "' + msg.actual + '" is deprecated, use "' + msg.expected + '" instead';
  },
  invalidField(warning) {
    return 'invalid property: "' + warning.prop + '". Since `options.knownOnly` is true, only properties with fields defined on the schema may be used.';
  },
  invalidFile(warning) {
    return 'file "' + warning.message.actual + '" does not exist on the file system';
  },
  invalidType(warning) {
    let msg = warning.message;
    return 'expected "' + warning.prop + '" to be '
      + utils.article(msg.expected) + ' but got "'
      + msg.actual + '"';
  },
  invalidValue(warning) {
    let actual = warning.message.actual;
    return 'invalid value defined on property "' + warning.prop + '": ' + util.inspect(actual);
  }
};
