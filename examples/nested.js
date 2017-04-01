'use strict';

var Schema = require('..');

var sub = new Schema()
  .field('x', {default: 'xxx'})
  .field('y', {default: 'yyy'})
  .field('z', {
    normalize: function(val) {
      return val || 'zzz'
    }
  })

var foo = new Schema()
  .field('a', {default: 'aaa'})
  .field('b', {default: 'bbb'})
  .field('c', {default: 'ccc'})

var bar = new Schema()
  .field('d', {default: 'ddd'})
  .field('e', {default: 'eee'})
  .field('f', {default: 'fff'})

var baz = new Schema()
  .field('g', {default: 'ggg'})
  .field('h', {default: 'hhh'})
  .field('i', sub)
  .field('j', {default: 'jjj'})

var config = {baz: {i: {z: null}}, foo: 'bar'};
var schema = new Schema()
  .field('foo', foo)
  .field('bar', bar)
  .field('baz', baz)
  .field('qux', function() {
    return 'zzz';
  })
  .normalize(config)


console.log(config)
