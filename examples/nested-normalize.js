'use strict';

var Schema = require('..');

var foo = new Schema({
    normalize: function(val, key, config, schema) {
      console.log(this)
      return {};
    }
  })
  .field('a', {default: 'aaa'})
  .field('b', {default: 'bbb'})
  .field('c', {default: 'ccc'})

var config = {foo: ['bar']};
var schema = new Schema()
  .field('foo', ['array'], foo)
  .field('bar', {default: 'baz'})
  // .field('foo', {
  //   normalize: function(val, key, config, schema) {
  //     if (typeof val !== 'string') {
  //       return foo.normalize.apply(foo, arguments);
  //     }
  //     return val;
  //   }
  // })
  .normalize(config)

console.log(config)
