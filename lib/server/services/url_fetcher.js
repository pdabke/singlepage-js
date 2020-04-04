/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Use of this source code is governed by MIT license which can be
 * found at https://opensource.org/licenses/MIT
 */
"use strict";
const fetch = require('node-fetch');
const LRU = require('lru-cache');
const AppError = require('../core/app_error');
const ContentCache = new LRU({max: 100, maxAge: 60000});

var _ALLOWED_DOMAINS = ["www.npr.org", "feeds.bbci.co.uk", "www.espn.com"]
const URLFetcher = {
  async init(config) {
    if (config.URL_FETCHER && config.URL_FETCHER.ALLOWED_DOMAINS) _ALLOWED_DOMAINS = config.URL_FETCHER.ALLOWED_DOMAINS;
  },

  async fetch(params) {
    if (!params.url) throw new Error('Missing required parameter: url');
    var url = params.url.trim();
    if (url.length > 255) throw new Error('URL string more than 255 characters');
    var result = ContentCache.get(url);
    if (result) return result;

    if (!(url.startsWith('http://') || url.startsWith('https://'))) return new AppError('error_invalid_url')
    var domain = extractDomain(params.url);
    if (!_ALLOWED_DOMAINS.includes(domain)) return new AppError('error_domain_fetch_not_allowed');
    try {
      let resp = await fetch(url);
      if (resp.ok) {
        let respText = resp.text();
        ContentCache.set(url, respText);
        return respText;
      } else {
        return new AppError(resp.statusText);
      }
    } catch (e) {
      return new AppError('error_failed_to_fetch_url');
    }
  }
}

function extractDomain(url) {
  url = url.substring(url.indexOf('//') + 2);
  let index = url.indexOf('/');
  if (index > -1) url = url.substring(0, index);
  return url;
}
module.exports = URLFetcher;