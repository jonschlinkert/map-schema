'use strict';

require('mocha');
var assert = require('assert');
var Schema = require('..');
var schema;

describe('update', function() {
  beforeEach(function() {
    schema = new Schema();
  });

  it('should update a field from the schema with the given value', function() {
    schema
      .field('license', 'string', {
        default: 'MIT'
      })
      .field('licenses', ['array', 'object'], {
        normalize: function(val, key, config, schema) {
          if (Array.isArray(val)) {
            schema.update('license', val[0].type, config);
            schema.omit(key);
          }
        }
      })

    var config = schema.normalize({licenses: [{type: 'Foo'}]});
    assert.equal(config.license, 'Foo');
    assert.equal(typeof config.licenses, 'undefined');
  });

  it('should update a field from the schema', function() {
    schema
      .field('license', 'string', {
        normalize: function(val, key, config, schema) {
          return config.foo || 'nada';
        }
      })
      .field('licenses', ['array', 'object'], {
        normalize: function(val, key, config, schema) {
          if (Array.isArray(val)) {
            config.foo = 'MIT';
            schema.update('license', config);
            schema.omit(key);
          }
        }
      })

    var config = schema.normalize({licenses: [{type: 'Foo'}]});
    assert.equal(config.license, 'MIT');
    assert.equal(typeof config.licenses, 'undefined');
  });

  it('should get a property from a field on schema', function() {
    schema.field('name', 'string');
    var types = schema.get('name', 'types');
    assert(Array.isArray(types));
    assert.equal(types[0], 'string');
  });
});
