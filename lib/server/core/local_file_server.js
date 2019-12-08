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
const path = require('path');
const mustache = require('mustache');
const Namespace = require('./namespace');
const Response = require('./response');
const ServiceDirectory = require('./service_directory');
const Util = require('../util/util');

var Cache = null;
var _BUILD_OUTPUT = null;
var _PROTOCOL = '//';

var _INDEX_FILE = null;

var _PAGE_LAYOUTS = null;
// var _THEMES = null;

var _ASSETS_BASE_DIR = null;
var _SRC_BASE_DIR = null;
var _CONFIG = null;
const LocalFileServer = {
  init(config, buildOutput) {
    _CONFIG = config;
    _BUILD_OUTPUT = buildOutput;
    var distDir = process.env.SP_DIST_DIR ? path.resolve(process.env.SP_DIST_DIR) : path.resolve(process.env.SP_APP_BASE, 'dist');
    if (process.env.SP_DIST_DIR || process.env.NODE_ENV == 'production') {
      _ASSETS_BASE_DIR = path.resolve(distDir, 'client');
      _SRC_BASE_DIR = _ASSETS_BASE_DIR;
    } else {
      _ASSETS_BASE_DIR = path.resolve(process.env.SP_APP_BASE, 'assets');
      _SRC_BASE_DIR = path.resolve(process.env.SP_APP_BASE, 'src', 'www');
    }

    _PAGE_LAYOUTS = _BUILD_OUTPUT ? JSON.parse(_BUILD_OUTPUT.code['page_layouts.json']) :
      JSON.parse(fs.readFileSync(path.resolve(distDir, 'server', 'resources', 'page_layouts.json')));
      
    Cache = ServiceDirectory.getInternalService("Cache").permanentCache;
    LocalFileServer.readIndexFile();
        
  },
  
  getIndexFileLocation() {
    return Util.isFile(path.resolve(_SRC_BASE_DIR, 'index.html')) ?
      path.resolve(_SRC_BASE_DIR, 'index.html') :
      path.resolve(process.env.SP_HOME, 'dev','app_minimal','src', 'www', 'index.html');
  },

  readIndexFile() {
    var f = this.getIndexFileLocation();
    _INDEX_FILE = fs.readFileSync(f, 'utf-8');
    // Ideally we want to remove all cached index files but not sure if all cache
    // implementations will support that.
    Cache.reset();
  
  },
  
  async handleSPFileRequest(res, relPath) {
    if (relPath.includes('..')) return Response.notFound(res);
    // The following covers the scenario when we get livereload request which adds a parameter ?livereload=1234
    if (relPath.includes('?')) {
      console.log(relPath);
      relPath = relPath.substring(0, relPath.indexOf('?'));

    }
    //console.log(relPath);
    var filePath = null;
    if (relPath.startsWith('components/')) {
      if (_BUILD_OUTPUT) {
        try { 
          let comp = relPath.substring("components/".length);
          Response.sendFile(res, _BUILD_OUTPUT.components[comp], relPath); 
        } catch (e) { 
          console.log(e);
        }
        return;
      }
      filePath = path.join(_ASSETS_BASE_DIR, relPath);
    } else if (relPath.startsWith('spcomponents/')) {
      let comp = relPath.substring("spcomponents/".length);
      let compFile = null;
      if (_BUILD_OUTPUT) {
        compFile = path.resolve(process.env.SP_HOME, 'dist', 'components', comp);
      } else {
        compFile = path.resolve(_ASSETS_BASE_DIR, 'spcomponents', comp);
      }
      if (fs.existsSync(compFile)) {
        Response.sendFile(res, fs.readFileSync(compFile), relPath);
      } else {
        console.error('Received request for non-existent file: ' + relPath);
        return Response.notFound(res)
      }
      return;
    } else {
      if (_BUILD_OUTPUT && _BUILD_OUTPUT.code[relPath]) {
        try { Response.sendFile(res, _BUILD_OUTPUT.code[relPath], relPath); } catch (e) { console.log(e);}
        return;
      }
      if (fs.existsSync(path.resolve(_ASSETS_BASE_DIR, relPath))) {
        filePath =  path.resolve(_ASSETS_BASE_DIR, relPath);
      } else if (process.env.SP_HOME) {
        filePath = path.resolve(process.env.SP_HOME, 'dev', 'app_minimal', 'assets', relPath);
      } else {
        console.error('Received request for non-existent file: ' + relPath);
        return Response.notFound(res)
      }
    }
    if (!Util.isFile(filePath)) return Response.notFound(res);
      fs.readFile(filePath, (err, data) => {
        if (err) {
          console.log('Failed to deliver SP file: ' + filePath)
          console.log(err)
          Response.staticInternalError(res);
        } else {
          try { Response.sendFile(res, data, filePath); } catch (e) { console.log(e);}
        }
      });
  },

  uncacheIndexFile(siteUrl) {
    Cache.remove(Namespace.INDEX_FILE, siteUrl);
  },

  async handleIndexFileRequest(req, res) {
    await handlePortalFileRequest(req, res, _INDEX_FILE, Namespace.INDEX_FILE);
  },
/*
  getThemes() {
    return _THEMES;
  },
*/
  getPageLayouts() {
    return _PAGE_LAYOUTS;
  },

  getAppComponents() {
    return _APP_COMPONENTS;
  }
}

async function handlePortalFileRequest(req, res, fileName, ns) {
  try {
    var siteUrl = _PROTOCOL + req.headers['host'] + Util.stripLastSlash(req.url);

    var indexFile = Cache.get(ns, siteUrl);
    if (indexFile) {
      try { Response.sendFile(res, indexFile, 'html') } catch (e) { console.log(e);}
      return;
    }
    var rawSiteInfo = await ServiceDirectory.getService('SiteService').getSiteInfo({}, {siteURL: siteUrl}, {}, ['SUPERADMIN']);
  
    var localEnv = {};
    localEnv.SITE_TITLE = rawSiteInfo.title ? rawSiteInfo.title : _CONFIG.SITE_TITLE;
    localEnv.SITE_KEYWORDS = rawSiteInfo.keywords ? rawSiteInfo.keywords : _CONFIG.SITE_KEYWORDS;
    localEnv.SITE_DESCR = rawSiteInfo.descr ? rawSiteInfo.descr : _CONFIG.SITE_DESCR;
    localEnv.SITE_AUTHOR = rawSiteInfo.author ? rawSiteInfo.author : _CONFIG.SITE_AUTHOR;
    //localEnv.SITE_THEME = rawSiteInfo.theme ? rawSiteInfo.theme : 'default';
    localEnv.SITE_LOGO_URL = rawSiteInfo.logoURL ? rawSiteInfo.logoURL : _CONFIG.CDN_URL + "/images/app_logo.png";
    localEnv.CDN_URL = _CONFIG.CDN_URL;
    indexFile = mustache.render(fileName, localEnv);
    Cache.put(ns, siteUrl, indexFile);
    Response.sendFile(res, indexFile, 'html')
  } catch (e) {
    console.log('Bad [index login logout ] .html request');
    console.log(e.stack);
    Response.staticInternalError(res);
    return;
  }
}
/*
function createThemes(spHome) {
  var cssDirName = path.join(spHome, '/dist/css');
  var cssDir = fs.readdirSync(cssDirName);
  var themes = [];
  cssDir.forEach(function(fileName, index) {
    if (fs.lstatSync(path.resolve(cssDirName, fileName)).isDirectory()) {
      let label = Util.toTitleCase(fileName, true);
      themes.push({value: fileName, label: label});
    }
  });
  return themes;
}
*/
module.exports = LocalFileServer;

