/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
"use strict";
const process = require('process');
const LocalFileServer = require('../core/local_file_server');
const ServiceGateway = require('../core/service_gateway');
const ComponentRegistry = require('../core/component_registry');

var _WATCH = null;
/**
 * A convenience service used to supply site, user, and some admin info to the UI in one call
 */
const AppService = {
  init(config) {
    if (process.env.NODE_ENV == 'development') {
      _WATCH = {port: process.env.SP_RELOAD_PORT | 35729};
    }
  },
  async getAppInfo(params, clientInfo, userInfo, roles) {
    let resp = {watch: _WATCH};
    resp.user = await ServiceGateway.getService('UserService').getUserInfo(params, clientInfo, userInfo, roles);
    resp.site = await ServiceGateway.getService('SiteService').getSiteInfo(params, clientInfo, userInfo, roles);
    resp.appComponents = ComponentRegistry.getComponents();

    resp.adminData = {};
    if (roles) {
      /*
      if (roles.includes('SUPERADMIN') || roles.includes('ADMIN')) {
        resp.adminData.themes = LocalFileServer.getThemes();
      }
      */
      if (roles.includes('SUPERADMIN')) {
        resp.adminData.pageLayouts = LocalFileServer.getPageLayouts();
      }
    }
    return resp;
  }
}

module.exports = AppService;