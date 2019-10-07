/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
'use strict';
const process = require('process');
const path = require('path');
const fs = require('fs');
const BuiltinServices = require('../services/builtin_services');

var _CONFIG = null;
var _SYSTEM_SERVICE_NAMES = ['AppService', 'UserService', 'SiteService', 'SessionService'];
var _SYSTEM_INTERNAL_SERVICE_NAMES = ['ObjectStore', 'Cache', 'EmailService', 'FileStore', 'TemplateService'];
var Services = {};
var InternalServices = {};

var ServiceLoader = {
  async init(config) {
    _CONFIG = config;

    var s = _SYSTEM_SERVICE_NAMES;
    for (let i=0; i<s.length; i++) {
      if (config[s[i]]) {
        Services[s[i]] = require(config[s[i]]);
      } else {
        Services[s[i]] = BuiltinServices[s[i]];
      }
    }
    for (let i=0; i<s.length; i++) {
      if (Services[s[i]]['init'])  await Services[s[i]].init(config);
    }

    s = _SYSTEM_INTERNAL_SERVICE_NAMES;
    for (let i=0; i<s.length; i++) {
      if (config[s[i]]) {
        InternalServices[s[i]] = require(config[s[i]]);
      } else {
        InternalServices[s[i]] = BuiltinServices[s[i]];
      }
    }
    for (let i=0; i<s.length; i++) {
      if (InternalServices[s[i]]['init']) await InternalServices[s[i]].init(config);
    }

    await autoRegister(config);

    if (process.env.NODE_ENV == 'development') {
      let chokidar = require('chokidar');
      var serviceWatcher = chokidar.watch(path.resolve(process.env.SP_APP_BASE, 'server', 'services'));
      serviceWatcher.on('ready', function() {
        serviceWatcher.on('add', ServiceLoader.addService)
      .on('change', ServiceLoader.updateService)
      .on('unlink', ServiceLoader.removeService);
      });
    }
    return [Services, InternalServices];
  },

  async registerService(name, service) {
    if (!service) {
      console.error('Attempt to register service with null name.');
      throw new Error('Service name must be specified.');
    }

    if (Services[name]) {
      console.error('Attempt to register service with duplicate name.');
      throw new Error('Duplicate service name ' + name + '.');
    }

    if (!service) {
      console.error('Attempt to register a null service object.');
      throw new Error('Null service object');
    }

    if (service.init) {
      await service.init(_CONFIG);
    }
    Services[name] = service;
  },

  async addService(filePath) {
    if (!filePath.endsWith('Service.js')) return;
    let name = getServiceNameFromPath(filePath);
    try {
      let service = require(filePath);
      await ServiceLoader.registerService(name, service);
      console.log('Registered ' + filePath + ' as ' + name);
    } catch (e) {
      console.error("Failed to register service at path: " + filePath);
      console.error(e);
    }
  },

  async updateService(filePath) {
    ServiceLoader.removeService(filePath);
    await ServiceLoader.addService(filePath)
  },

  removeService(filePath) {
    if (!filePath.endsWith('.js')) return;
    delete require.cache[filePath];
    delete Services[getServiceNameFromPath(filePath)];
    console.log('Removed service at path ' + filePath);
  }
}

module.exports = ServiceLoader;

function getServiceNameFromPath(filePath) {
  let serviceFile = path.basename(filePath);
  let service = serviceFile.substring(0, serviceFile.length - 3);
  return toTitleCase(service);
}
async function autoRegister(config) {
  var servicesDir = null;
  if (process.env.SP_DIST_DIR) servicesDir = path.resolve(process.env.SP_DIST_DIR, 'server', 'services');
  else if (process.env.NODE_ENV == 'development') servicesDir = path.resolve(process.env.SP_APP_BASE, 'server', 'services');
  else servicesDir = path.resolve(process.env.SP_APP_BASE, 'dist', 'server', 'services');
  if (!fs.existsSync(servicesDir)) return;
  var services = fs.readdirSync(servicesDir);
  for (let ii=0; ii<services.length;ii++) {
    ServiceLoader.addService(path.resolve(servicesDir, services[ii]));
  };
}

function toTitleCase(str, preserveSpace) {
  if (preserveSpace) {
    str = str.replace(/(_|-|\s+)\w/g, function (g) { return ' ' + g[g.length - 1].toUpperCase(); });
  } else {
    str = str.replace(/(_|-|\s+)\w/g, function (g) { return g[g.length - 1].toUpperCase(); });
  }
  str = str[0].toUpperCase() + str.substring(1);
  return str;
}

