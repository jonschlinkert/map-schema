'use strict';

const Schema = require('..');

let foo = new Schema({
  format() {
    return {};
  }
})
  .field('a', { default: 'aaa' })
  .field('b', { default: 'bbb' })
  .field('c', { default: 'ccc' });

let baz = new Schema()
  .field('a', { default: 'aaa' })
  .field('b', { default: 'bbb' })
  .field('c', { default: 'ccc' });

let config = { foo: ['bar'] };
let schema = new Schema()
  .field('foo', ['array'], foo)
  .field('bar', { default: 'baz' })
  .field('baz', {
    format() {
      return baz.format({});
    }
  })
  .format(config);

console.log(config);
console.log(schema);
