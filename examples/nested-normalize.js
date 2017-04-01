'use strict';

var Schema = require('..');

var foo = new Schema({
    normalize: function() {
      return {};
    }
  })
  .field('a', {default: 'aaa'})
  .field('b', {default: 'bbb'})
  .field('c', {default: 'ccc'})

var baz = new Schema()
  .field('a', {default: 'aaa'})
  .field('b', {default: 'bbb'})
  .field('c', {default: 'ccc'})

var config = {foo: ['bar']};
var schema = new Schema()
  .field('foo', ['array'], foo)
  .field('bar', {default: 'baz'})
  .field('baz', {
    normalize: function() {
      return baz.normalize({});
    }
  })
  .normalize(config)

console.log(config)
