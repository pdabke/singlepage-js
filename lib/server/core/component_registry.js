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

var _COMPONENT_LIST = [];
var _COMPONENT_MAP = {};
var _COMPONENT_SETTINGS = {};

var ComponentRegistry = {
  init(buildOutput) {

    if (process.env.NODE_ENV == 'development') {
      _COMPONENT_LIST = buildOutput.componentMetadata.componentList;
      _COMPONENT_MAP = buildOutput.componentMetadata.componentMap;
      _COMPONENT_SETTINGS = buildOutput.componentMetadata.componentSettings;
    } else {
      let distDir = process.env.SP_DIST_DIR ? path.resolve(process.env.SP_DIST_DIR) : path.resolve(process.env.SP_APP_BASE, 'dist');
      let compData = require(path.resolve(distDir, 'server', 'resources', 'component_metadata.js'));
      for (let ii=0; ii<compData.length;ii++) {
        _COMPONENT_LIST.push(compData[ii].metadata);
        _COMPONENT_MAP[compData[ii].metadata[0]] = compData[ii].metadata;
        _COMPONENT_SETTINGS[compData[ii].metadata[0]] = compData[ii].settings;
      }
    } 
  },

  getComponents() {
    return _COMPONENT_LIST;
  },

  isComponentRegistered(name) {
    return _COMPONENT_MAP[name];
  },

  // Returns the settings form extracted from the component definition for service side validation
  // when administrator changes settings for a component.
  getComponentSettings(cName) {
    return _COMPONENT_SETTINGS[cName];
  }

};

module.exports = ComponentRegistry;