'use strict';

const Schema = require('..');

let sub = new Schema()
  .field('x', { default: 'xxx' })
  .field('y', { default: 'yyy' })
  .field('z', {
    format(value) {
      return value == null ? 'zzz' : value;
    }
  });

let foo = new Schema()
  .field('a', { default: 'aaa' })
  .field('b', { default: 'bbb' })
  .field('c', { default: 'ccc' });

let bar = new Schema()
  .field('d', { default: 'ddd' })
  .field('e', { default: 'eee' })
  .field('f', { default: 'fff' });

let baz = new Schema()
  .field('g', { default: 'ggg' })
  .field('h', { default: 'hhh' })
  .field('i', sub)
  .field('j', { default: 'jjj' });

let result = new Schema()
  .field('foo', foo)
  .field('bar', bar)
  .field('baz', baz)
  .field('qux', { format: () => 'zzz' })
  .format({ baz: { i: { z: null } }, foo: 'bar' });

console.log(result);
