/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
'use strict';
const process = require('process');
const fs = require('fs');
const path = require('path');
const LocalFileServer = require('../core/local_file_server');
const Constants = require('../../common/constants');
const AppError = require('../core/app_error');
const Util = require('../util/util');
const SiteUtil = require('./site_util');
const ComponentRegistry = require('../core/component_registry');
const Validator = require('../../common/validator');

var _SITE_TEMPLATE_DIR = null;
var _SITE_INFO_PATH = null;
var _SITE_INFO = null;

const StaticSiteService = {
  ACL: {
    setComponentConfig: [Constants.ROLE_ADMIN, Constants.ROLE_SUPERADMIN],
    saveSiteDef: [Constants.ROLE_SUPERADMIN],
    saveSiteMetadata: [Constants.ROLE_ADMIN, Constants.ROLE_SUPERADMIN],
    saveSiteDefAs: [Constants.ROLE_SUPERADMIN]
  },

  async init() {
    _SITE_TEMPLATE_DIR = process.env.SP_DIST_DIR ? path.resolve(process.env.SP_DIST_DIR, "server") : path.resolve(process.env.SP_APP_BASE, 'server');
    _SITE_INFO_PATH = path.join(_SITE_TEMPLATE_DIR, 'app.json');
    if (fs.existsSync(_SITE_INFO_PATH)) {
      _SITE_INFO = JSON.parse(fs.readFileSync(_SITE_INFO_PATH, 'utf8'));
    } else {
      _SITE_INFO = JSON.parse(fs.readFileSync(path.join(process.env.SP_HOME, 'dev', 'app_minimal', 'server', 'app.json'), "utf8"));
      saveSiteInfo();
    }
  },

  async getSiteInfo(params, clientInfo, user, roles) {
    var si = await SiteUtil.getSiteInfo(_SITE_INFO, clientInfo, user, roles);
    return si;
  },

  /* 
   * In the static implementation, we save the entire site definition since there is no
   * distinction between a site and a site template. 
   */
  async setComponentConfig(params, clientInfo, user) {
    if (!params.component_id || !params.config) {
      throw new Error('Missing one or more required parameters: component_id, config');
    }
    var skName = await Util.lookupComponentName(params.component_id, _SITE_INFO);
    if (!skName) throw new Error('Invalid component ID');
    var settings = ComponentRegistry.getComponentSettings(skName);
    if (!settings) throw new Error('Component ' + skName + ' does not have a settings form configured.');
    var errors = {};
    var numErrors = Validator.validateForm(settings, params.config, errors);
    if (numErrors > 0) return new AppError('error_please_correct_errors', errors);
    var siteData = _SITE_INFO.siteData;
    if (!siteData) siteData = {};
    var skConfig = siteData.componentConfig;
    if (!skConfig) skConfig = {};
    skConfig['sp_' + params.component_id] = params.config;
    siteData.componentConfig = skConfig;
    _SITE_INFO.siteData = siteData;
    saveSiteInfo();
  },

  async saveSiteMetadata(params, clientInfo, user) {
    _SITE_INFO.title = params.title;
    _SITE_INFO.author = params.author;
    _SITE_INFO.descr = params.descr;
    _SITE_INFO.keywords = params.keywords;
    _SITE_INFO.accessType = params.accessType;
    var oldTheme = _SITE_INFO.theme ? _SITE_INFO.theme : '';
    var newTheme = params.theme ? params.theme : '';
    _SITE_INFO.theme = params.theme;
    saveSiteInfo();
    if (oldTheme != newTheme) {
      LocalFileServer.uncacheIndexFile(clientInfo.siteURL)
    }
  },

  async saveSiteDefAs(params, clientInfo, user) {
    if (!params.name) {
      throw new Error('Missing required parameter: name');
    }

    if (!params.overwrite) {
      // Check if the file of that name exists
      if (fs.existsSync(path.join(_SITE_TEMPLATE_DIR, params.name + '.json'))) {
        return new AppError('error_template_exists');
      }
    }
    saveSiteInfo(path.join(_SITE_TEMPLATE_DIR, params.name + '.json'));
    _SITE_INFO_PATH = _SITE_TEMPLATE_DIR + '/' + params.name + '.json';
  },

  async saveSiteDef(params, clientInfo, user) {
    if (!params.siteDef) {
      throw new Error('Missing one or more required parameters: siteDef');
    }
    var errors = SiteUtil.validateSiteDef(params.siteDef);
    if (errors) {
      return new AppError("Invalid site def", errors);
    }
    _SITE_INFO.siteDef = params.siteDef;
    saveSiteInfo();
  }
}

function saveSiteInfo(filePath) {
  mergeComponentConfig();
  var sinfo = JSON.parse(JSON.stringify(_SITE_INFO));
  sinfo.siteDef = removeAccessFlag(sinfo.siteDef);
  //console.log(JSON.stringify(sinfo));
  if (filePath)
    fs.writeFileSync(filePath, JSON.stringify(sinfo));
  else
    fs.writeFileSync(_SITE_INFO_PATH, JSON.stringify(sinfo));
}

function removeAccessFlag(site) {
  if (site.accessChecked) {
    site.accessChecked = undefined;
  }
  if (site.pages) {
    for (let ii=0; ii<site.pages.length; ii++) removeAccessFlag(site.pages[ii]);
  }
  if (site.containers) {
    for (let ii=0; ii<site.containers.length; ii++) removeAccessFlag(site.containers[ii]);
  }
  if (site.components) {
    for (let ii=0; ii<site.components.length; ii++) removeAccessFlag(site.components[ii]);
  }
  return site;
}

function mergeComponentConfig() {
  if (_SITE_INFO.siteData && _SITE_INFO.siteData.componentConfig) {
    Object.keys(_SITE_INFO.siteData.componentConfig).forEach(function (key, index) {
      var val = _SITE_INFO.siteData.componentConfig[key];
      var id = key.substring(key.indexOf('_') + 1);
      var comp = findComponentWithId(_SITE_INFO.siteDef, id);
      if (!comp) return;
      if (!comp.config) comp.config = {};
      Util.mixin(comp.config, val);
    });
    _SITE_INFO.siteData.componentConfig = undefined;
  }
}

function findComponentWithId(siteDef, id) {
  for (let i=0; i<siteDef.pages.length; i++) {
    var comp = findComponentWithIdHelper(siteDef.pages[i], id);
    if (comp) return comp;
  }
}

function findComponentWithIdHelper(page, id) {
    if (page.components) {
      for (let j=0; j<page.components.length; j++) {
          if (page.components[j].id == id) return page.components[j];
      }
  }

  if (page.containers) {
      for (let i=0; i<page.containers.length; i++) {
          var comp = findComponentWithIdHelper(page.containers[i], id);
          if (comp) return comp;
      }
  }

  if (page.pages) {
    for (let ii=0; ii<page.pages.length; ii++) {
      let comp = findComponentWithIdHelper(page.pages[ii], id);
      if (comp) return comp;
    }
  }
}

module.exports = StaticSiteService;