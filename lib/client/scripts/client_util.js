/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
"use strict";
var SPUtil = {
  computeSiteURL: function () {
    var systemPaths = ['/sp-files'];
    var url = window.location.href;
    if (url.indexOf('#') != -1) url = url.substring(0, url.indexOf('#') - 1);
    for (let i = 0; i < systemPaths.length; i++) {
      if (url.indexOf(systemPaths[i]) != -1) {
        return url.substring(0, url.indexOf(systemPaths[i]));
      }
    }
    return url.indexOf('/', url.indexOf('//') + 2) === -1 ? url : url.substring(0, url.lastIndexOf('/'), url.indexOf('//') + 2);
  },

  mixin: function (target, source) {
    if (!source || !SPUtil.isObject(source)) return;
    Object.keys(source).forEach(function (key) {
      var val = source[key];
      if (target[key] && SPUtil.isObject(val)) {
        SPUtil.mixin(target[key], val);
      } else {
        target[key] = val;
      }
    });
  },

  isObject: function (val) {
    if (!val) return false;
    return typeof val === 'object' && !Array.isArray(val);
  },

  unescapeHTML: function(input) {
    var doc = new DOMParser().parseFromString(input, "text/html");
    return doc.documentElement.textContent;
  },

  toTitleCase(str, preserveSpace) {
    if (preserveSpace) {
      str = str.replace(/(_|-|\s+)\w/g, function (g) { return ' ' + g[g.length - 1].toUpperCase(); });
    } else {
      str = str.replace(/(_|-|\s+)\w/g, function (g) { return g[g.length - 1].toUpperCase(); });
    }
    str = str[0].toUpperCase() + str.substring(1);
    return str;
  }
}

export default SPUtil;