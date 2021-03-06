# map-schema [![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=W8YFZ425KND68) [![NPM version](https://img.shields.io/npm/v/map-schema.svg?style=flat)](https://www.npmjs.com/package/map-schema) [![NPM monthly downloads](https://img.shields.io/npm/dm/map-schema.svg?style=flat)](https://npmjs.org/package/map-schema) [![NPM total downloads](https://img.shields.io/npm/dt/map-schema.svg?style=flat)](https://npmjs.org/package/map-schema) [![Build Status](https://travis-ci.org/jonschlinkert/map-schema.svg?branch=master)](https://travis-ci.org/jonschlinkert/map-schema)

> Normalize an object by running normalizers and validators that are mapped to a schema.

You might also be interested in [normalize-pkg](https://github.com/jonschlinkert/normalize-pkg).

Please consider following this project's author, [Jon Schlinkert](https://github.com/jonschlinkert), and consider starring the project to show your :heart: and support.

## Table of Contents

<details>
<summary><strong>Details</strong></summary>

- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [About](#about)

</details>

## Install

Install with [npm](https://www.npmjs.com/) (requires [Node.js](https://nodejs.org/en/) >=10):

```sh
$ npm install --save map-schema
```

## Usage

```js
var schema = require('map-schema');
```

**Example**

This is a basic example schema for normalizing and validating fields on `package.json` (a full version of this will be available on [normalize-pkg](https://github.com/jonschlinkert/normalize-pkg) when complete):

```js
var fs = require('fs');
var isObject = require('isobject');
var Schema = require('map-schema');

// create a schema
var schema = new Schema()
  .field('name', 'string')
  .field('description', 'string')
  .field('repository', ['object', 'string'], {
    normalize: function(val) {
      return isObject(val) ? val.url : val;
    }
  })
  .field('main', 'string', {
    validate: function(filepath) {
      return fs.existsSync(filepath);
    }
  })
  .field('version', 'string', {
    default: '0.1.0'
  })
  .field('license', 'string', {
    default: 'MIT'
  })

var pkg = require('./package');
// normalize an object
console.log(schema.normalize(pkg));
// validation errors array
console.log(schema.errors);
```

**Errors**

Validation errors are exposed on `schema.errors`. Error reporting is pretty basic right now but I plan to implement something better soon.

## API

**Params**

* `options` **{Object}**

**Example**

```js
var schema = new Schema()
  .field('name', 'string')
  .field('version', 'string')
  .field('license', 'string')
  .field('licenses', 'array', {
    normalize: function(val, key, config) {
       // convert license array to `license` string
       config.license = val[0].type;
       delete config[key];
    }
  })
  .normalize(require('./package'))
```

Set `key` on the instance with the given `value`.

**Params**

* `key` **{String}**
* `value` **{Object}**

Push a warning onto the `schema.warnings` array. Placeholder for
better message handling and a reporter (planned).

**Params**

* `method` **{String}**: The name of the method where the warning is recorded.
* `prop` **{String}**: The name of the field for which the warning is being created.
* `message` **{String}**: The warning message.
* `value` **{String}**: The value associated with the warning.
* `returns` **{any}**

**Params**

* `name` **{String}**
* `type` **{String|Array}**
* `options` **{Object}**
* `returns` **{Object}**: Returns the instance for chaining.

**Example**

```js
var semver = require('semver');

schema
  .field('keywords', 'array')
  .field('version', 'string', {
    validate: function(val, key, config, schema) {
      return semver.valid(val) !== null;
    }
  })
```

**Params**

* `name` **{Strign}**
* `prop` **{String}**
* `returns` **{Object|any}**: Returns the field instance or the value of `prop` if specified.

**Example**

```js
schema.field('bugs', ['object', 'string']);
var field = schema.get('bugs', 'types');
//=> ['object', 'string']
```

Omit a property from the returned object. This method can be used
in normalize functions as a way of removing undesired properties.

**Params**

* `key` **{String}**: The property to remove
* `returns` **{Object}**: Returns the instance for chaining.

Update a property on the returned object. This method will trigger validation
and normalization of the updated property.

**Params**

* `key` **{String}**: The property to update.
* `val` **{any}**: Value of the property to update.
* `returns` **{Object}**: Returns the instance for chaining.

Returns true if field `name` is an optional field.

**Params**

* `name` **{String}**
* `returns` **{Boolean}**

Returns true if field `name` was defined as a required field.

**Params**

* `name` **{String}**
* `returns` **{Boolean}**

Checks the config object for missing fields and. If found,
a warning message is pushed onto the `schema.warnings` array,
which can be used for reporting.

**Params**

* `config` **{Object}**
* `returns` **{Array}**

**Params**

* `config` **{Object}**
* `returns` **{Object}**: Returns the config object with keys sorted to match the given array of keys.

**Example**

```js
schema.sortObject({z: '', a: ''}, ['a', 'z']);
//=> {a: '', z: ''}
```

When `options.sortArrays` _is not false_, sorts all arrays in the
given `config` object using JavaScript's native `.localeCompare`
method.

**Params**

* `config` **{Object}**
* `returns` **{Object}**: returns the config object with sorted arrays

Returns true if the given value is valid for field `key`.

**Params**

* `key` **{String}**
* `val` **{any}**
* `config` **{Object}**
* `returns` **{Boolean}**

Normalize the given `config` object.

**Params**

* **{String}**: key
* **{any}**: value
* **{Object}**: config
* `returns` **{Object}**

Normalize a field on the schema.

**Params**

* **{String}**: key
* **{any}**: value
* **{Object}**: config
* `returns` **{Object}**

Visit `method` over the given object or array.

**Params**

* `method` **{String}**
* `value` **{Object|Array}**
* `returns` **{Object}**: Returns the instance for chaining.

### [Field](lib/field.js#L22)

Create a new `Field` of the given `type` to validate against, and optional `config` object.

**Params**

* `type` **{String|Array}**: One more JavaScript native types to use for validation.
* `config` **{Object}**

**Example**

```js
const field = new Field('string', {
  normalize: function(val) {
    // do stuff to `val`
    return val;
  }
});
```

### [.isValidType](lib/field.js#L67)

Returns true if the given `type` is a valid type.

**Params**

* `type` **{String}**
* `returns` **{Boolean}**

### [.validate](lib/field.js#L89)

Called in `schema.validate`, returns true if the given `value` is valid. This default validate method returns true unless overridden with a custom `validate` method.

* `returns` **{Boolean}**

**Example**

```js
var field = new Field({
  types: ['string']
});

field.validate('name', {});
//=> false
```

### [.normalize](lib/field.js#L108)

Normalize the field's value.

**Example**

```js
var field = new Field({
  types: ['string'],
  normalize: function(val, key, config, schema) {
    // do stuff to `val`
    return val;
  }
});
```

## About

<details>
<summary><strong>Contributing</strong></summary>

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](../../issues/new).

</details>

<details>
<summary><strong>Running Tests</strong></summary>

Running and reviewing unit tests is a great way to get familiarized with a library and its API. You can install dependencies and run tests with the following command:

```sh
$ npm install && npm test
```

</details>

<details>
<summary><strong>Building docs</strong></summary>

_(This project's readme.md is generated by [verb](https://github.com/verbose/verb-generate-readme), please don't edit the readme directly. Any changes to the readme must be made in the [.verb.md](.verb.md) readme template.)_

To generate the readme, run the following command:

```sh
$ npm install -g verbose/verb#dev verb-generate-readme && verb
```

</details>

### Related projects

You might also be interested in these projects:

* [get-value](https://www.npmjs.com/package/get-value): Use property paths like 'a.b.c' to get a nested value from an object. Even works… [more](https://github.com/jonschlinkert/get-value) | [homepage](https://github.com/jonschlinkert/get-value "Use property paths like 'a.b.c' to get a nested value from an object. Even works when keys have dots in them (no other dot-prop library can do this!).")
* [normalize-pkg](https://www.npmjs.com/package/normalize-pkg): Normalize values in package.json using the map-schema library. | [homepage](https://github.com/jonschlinkert/normalize-pkg "Normalize values in package.json using the map-schema library.")
* [object.omit](https://www.npmjs.com/package/object.omit): Return a copy of an object excluding the given key, or array of keys. Also… [more](https://github.com/jonschlinkert/object.omit) | [homepage](https://github.com/jonschlinkert/object.omit "Return a copy of an object excluding the given key, or array of keys. Also accepts an optional filter function as the last argument.")
* [object.pick](https://www.npmjs.com/package/object.pick): Returns a filtered copy of an object with only the specified keys, similar to `_.pick… [more](https://github.com/jonschlinkert/object.pick) | [homepage](https://github.com/jonschlinkert/object.pick "Returns a filtered copy of an object with only the specified keys, similar to`_.pick` from lodash / underscore.")
* [set-value](https://www.npmjs.com/package/set-value): Create nested values and any intermediaries using dot notation (`'a.b.c'`) paths. | [homepage](https://github.com/jonschlinkert/set-value "Create nested values and any intermediaries using dot notation (`'a.b.c'`) paths.")

### Author

**Jon Schlinkert**

* [GitHub Profile](https://github.com/jonschlinkert)
* [Twitter Profile](https://twitter.com/jonschlinkert)
* [LinkedIn Profile](https://linkedin.com/in/jonschlinkert)

### License

Copyright © 2020, [Jon Schlinkert](https://github.com/jonschlinkert).
Released under the [MIT License](LICENSE).

***

_This file was generated by [verb-generate-readme](https://github.com/verbose/verb-generate-readme), v0.8.0, on March 01, 2020._