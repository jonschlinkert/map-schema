'use strict';

const utils = require('./utils');

class Data {
  set() {
    utils.set.bind(this, this).apply(this, arguments);
    return this;
  }

  get() {
    return utils.get.bind(this, this).apply(this, arguments);
  }

  merge() {
    utils.merge.bind(this, this).apply(this, arguments);
    return this;
  }
}

module.exports = Data;
