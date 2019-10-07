/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
'use strict';

const LRU = require("lru-cache");

// TRANSIENT_CACHE is used to cache objects that are large in number but the usage of
// any one object is short lived (e.g. active user)
var TRANSIENT_CACHE = null;

// PERMANENT_CACHE is used to store objects that are few in number, infrequntly updated but
//  frequently accessed (e.g. email templates)
var PERMANENT_CACHE = null;

// PERISHABLE_CACHE is used to cache data that is expensive to retrieve, ok to serve for a short
// time but needs to be refreshed after a certain time (e.g. twitter feed search results)
var PERISHABLE_CACHE = null;

var TransientCacheService = {
  put(namespace, key, value) {
    TRANSIENT_CACHE.set(namespace + ':' + key, value);
  },
  remove(namespace, key) {
    TRANSIENT_CACHE.del(namespace + ':' + key);
  },
  get(namespace, key) {
    return TRANSIENT_CACHE.get(namespace + ':' + key);
  },
  reset() {
    PERMANENT_CACHE.reset();
  }
};

var PermanentCacheService = {
  put(namespace, key, value) {
    PERMANENT_CACHE.set(namespace + ':' + key, value);
  },
  remove(namespace, key) {
    PERMANENT_CACHE.del(namespace + ':' + key);
  },
  get(namespace, key) {
    return PERMANENT_CACHE.get(namespace + ':' + key);
  },
  reset() {
    PERMANENT_CACHE.reset();
  }
};

var PerishableCacheService = {
  put(namespace, key, value, maxAge) {
    PERISHABLE_CACHE.set(namespace + ':' + key, value, maxAge);
  },
  remove(namespace, key) {
    PERISHABLE_CACHE.del(namespace + ':' + key);
  },
  get(namespace, key) {
    return PERISHABLE_CACHE.get(namespace + ':' + key);
  },
  reset() {
    PERMANENT_CACHE.reset();
  }
}

var CacheService = {
  init(config) {
    var options1 = { max: config.TRANSIENT_CACHE_MAX_SIZE };
    var options2 = {
      max: config.PERISHABLE_CACHE_MAX_SIZE,
      maxAge: config.PERISHABLE_CACHE_MAX_AGE
    };
    TRANSIENT_CACHE = new LRU(options1);
    PERISHABLE_CACHE = new LRU(options2);
    PERMANENT_CACHE = new LRU();
  }
};
CacheService.transientCache = TransientCacheService;
CacheService.permanentCache = PermanentCacheService;
CacheService.perishableCache = PerishableCacheService;
module.exports = CacheService;
