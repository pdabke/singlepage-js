/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 * The default service worker pre-caches a few framework resources
 * and then implements cache-first policy. If a resource is not
 * in cache, the network response is cached if valid. 
 * 
 * We create a unique cache for each service worker version. Older
 * caches are deleted when a new worker is activated.
 */
const VERSION = __VERSION__;
const CACHE_NAME = 'singlepage-cache-' + VERSION;
self.addEventListener('install', function(event) {
  console.log('Installing service worker version ' + VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(
        [
          '__CDN_URL__/lib/spapp.js',
          '__CDN_URL__/lib/spapp.css',
          '__CDN_URL__/images/app_logo.png',
          '__CDN_URL__/spcomponents/Dropdown.js',
          '__CDN_URL__/lib/validator.umd.js'
        ]
      );
    })
  );
});

self.addEventListener("activate", function(event) {
  console.log('Activating service worker version ' + VERSION);
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          console.log('Found cache ' + cacheName);
          if (CACHE_NAME !== cacheName &&  cacheName.startsWith("singlepage-cache")) {
            console.log("Deleting cache " + cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Caches all GET requests. This will most likely need to be modified
// for dynamic user created content
self.addEventListener('fetch', function(event) {
  if (event.request.method == 'GET') {
    event.respondWith(
      caches.open(CACHE_NAME).then(function(cache) {
        return cache.match(event.request).then(function (response) {
          return response || fetch(event.request).then(function(response) {
            // Cache only successful responses otherwise intermittent 404
            // responses get cached
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        });
      })
    );
  } 
});