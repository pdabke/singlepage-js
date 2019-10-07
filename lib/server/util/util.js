/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
'use strict'
const process = require('process');
const fs = require('fs');
const Crypto = require('crypto');
const CommonUtils = require('../../common/common_util');
// Make sure the key is exactly 8 character long for AES 128
const _DEFAULT_SESSION_KEY = '9xvwd658';
const Util = {
  
  mixin: function(target, source) {
    if (!source || !CommonUtils.isObject(source)) return;
      Object.keys(source).forEach(function(key,index) {
          var val = source[key];
          if (target[key] && CommonUtils.isObject(val)) {
            mixin(target[key], val);
          } else {
            target[key] = val;
          }
      });
  },

  union: function(array1, array2) {
    return [...new Set([...array1, ...array2])];
  },

  stripLastSlash(url) {
    if (!url) return url;
    if (url.endsWith('/')) return url.substring(0,url.length-1);
    return url;
  },

  partialCopy(src, props) {
    var len = props.length;
    var target = {};
    for (let i=0; i<len; i++) {
      if (src[props[i]]) target[props[i]] = src[props[i]];
    }
    return target;
  },

  partialCopyNeg(src, removeProps) {
    var target = Util.shallowCopy(src);
    var len = removeProps.length;
    for (let i=0; i<len; i++) {
      target[removeProps[i]] = undefined;
    }
    return JSON.parse(JSON.stringify(target));
  },

  shallowCopy(src) {
    var props = Object.keys(src);
    var len = props.length;
    var target = {};
    for (let i=0; i<len; i++) {
      if (src[props[i]]) target[props[i]] = src[props[i]];
    }
    return target;
  },

  deepCopy(src) {
    var ser = JSON.stringify(src);
    return JSON.parse(ser);
  },

  underscoreToCamel(str) {
    return str.replace(/_([a-z])/g, function (g) { return g[1].toUpperCase(); });
  },

  parsePGArray(ar) {
    var arr = ar.replace('{', '');
    arr = arr.replace('}', '');
    arr = arr.split(',');
    for (let i=0; i<arr.length; i++) arr[i] = arr[i].trim();
    return arr;
  },

  getFileNameFromPath(filePath) {
    var index = filePath.lastIndexOf('/');
    if (index == -1) {
      index = filePath.lastIndexOf('\\');
    }
    return filePath.substring(index + 1);
  },

  getDirectoryFromPath(filePath) {
    var index = filePath.lastIndexOf('/');
    if (index == -1) {
      index = filePath.lastIndexOf('\\');
    }
    return filePath.substring(0,index);
  },

  getExtension(filePath) {
    var index = filePath.lastIndexOf('.');
    if (index == -1) {
      return '';
    }
    return filePath.substring(index + 1);
  },

  isDir(path) {
    return fs.existsSync(path) && fs.lstatSync(path).isDirectory()
  },
  
  isFile(path, ext) {
    if (!fs.existsSync(path) || fs.lstatSync(path).isDirectory()) return false;
    if (!ext) return true;
    return path.endsWith(ext);
  },
  
  toTitleCase(str, preserveSpace) {
    if (preserveSpace) {
      str = str.replace(/(_|-|\s+)\w/g, function (g) { return ' ' + g[g.length - 1].toUpperCase(); });
    } else {
      str = str.replace(/(_|-|\s+)\w/g, function (g) { return g[g.length - 1].toUpperCase(); });
    }
    str = str[0].toUpperCase() + str.substring(1);
    return str;
  },

  decrypt(encrypted) {
    const decipher = Crypto.createDecipher('aes128', process.env.SP_SESSION_KEY || _DEFAULT_SESSION_KEY);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  },
  
  encrypt(plainText) {
    var cipher = Crypto.createCipher('aes128', process.env.SP_SESSION_KEY || _DEFAULT_SESSION_KEY);
    var encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  },

   lookupComponentName(id, siteInfo) {
    var siteTemplate = siteInfo.siteDef;
    if (!siteTemplate) return null;
    var pages = siteTemplate.pages;
    if (!pages) return null;
    for (let i=0; i<pages.length; i++) {
      let name = lookupComponentNameHelper(id, pages[i]);
      if (name) return name;
    }
  }
}

function   lookupComponentNameHelper(id, page) {
  if (page.components) {
    for (let i=0; i<page.components.length;i++) {
      if (page.components[i].id === id) return page.components[i].name;
    }
  }

  if (page.containers) {
    for (let i=0; i<page.containers.length; i++) {
      let name = lookupComponentNameHelper(id, page.containers[i]);
      if (name) return name;
    }
  }
  if (page.pages) {
    for (let i=0; i<page.pages.length; i++) {
      let name = lookupComponentNameHelper(id, page.pages[i]);
      if (name) return name;
    }
  }
  return null;
}

module.exports = Util;