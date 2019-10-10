/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
'use strict';
const path = require('path');
const fs = require('fs-extra');
const process = require('process');
const livereload = require('livereload');
const Build = require('./build');
const dotenv = require('dotenv');
const _SP_HOME = path.resolve(__dirname, '..', '..');

var Serve = {
  async handle(options) {
    // Indicate to build that it should compile files to memory
    options.isServe = true;
    if (options.appBase && options.distDir) {
      console.error('You can either specify app-base or dist-dir, but not both.');
      return;
    }

    // If neither appBase or distDir is specified try to figure out if the current
    // directory contains files that would help us determine 
    if (!options.appBase && !options.distDir) {
      if (fs.existsSync(path.resolve('.', 'src'))) {
        options.appBase = ".";
      } else {
        options.distDir = ".";
      }
    }

    // Require server.js from the right path and set spServer field on option since
    // the build needs it in the development mode to act on changes to the watched files
    const { Server } = options.distDir ? require(path.resolve(options.distDir, 'lib', 'spserver.js')) :
    require(path.resolve(options.appBase, 'lib', 'spserver.js'));
    options.spServer = Server;
    
    // Get security cert and key path before potential directory change
    if (options.cert) options.cert = path.resolve(options.cert);
    if (options.key) options.key = path.resolve(options.key);
    if (options.appBase) {
      options.appBase = path.resolve(options.appBase);
      process.chdir(options.appBase);
    }

    if (options.build) {
      if (!(options.build == 'production' || options.build == 'development')) {
        console.error("Invalid build value. Must be 'production' or 'development");
        return;
      }
      if (options.build == 'development' && options.distDir) {
        console.error('Build mode cannot be "development" when you specify distDir');
        return;
      }
    } else {
      if (options.distDir) options.build = 'production';
      else options.build = 'development';
    }


    if (options.build == 'development') {
      const port = options.reloadPort || 35729
      var reloadServer = livereload.createServer({ port: port, extraExts: ['vue'], delay: 1500 });
      var watchedPaths = path.resolve(options.appBase);
      reloadServer.watch(watchedPaths);
      closeServerOnTermination(reloadServer);
    }

    var buildOutput = null;
    if (options.build == 'development') {
      console.log('Building app components...')
      try {
        buildOutput = await Build.handle(options);
      } catch (e) {
        console.log(e);
        return;
      }
    }

    var config = {};
    if (options.distDir || options.build == 'production') {
      let distEnv = options.distDir ?
        path.resolve(options.distDir, 'server', 'resources', 'config.json')
        : path.resolve(options.appBase, 'dist', 'server', 'resources', 'config.json');
      let envContent = fs.readFileSync(distEnv, 'utf8');
      config = eval('(' + envContent + ")");
    }

    options.spHome = _SP_HOME;
/*
    console.debug('SinglePage.js install directory: ' + options.spHome);
    if (options.appBase) console.debug('SinglePage.js application directory: ' + options.appBase);
    if (options.distDir) console.debug('SinglePage.js dist directory: ' + options.distDir);
*/
    setupEnv(options);
    Server.start(config, buildOutput);
  }
}

function setupEnv(options) {
  var envFile = '.env' + options.build;
  var envPath = options.distDir ? path.resolve(options.distDir, envFile) : path.resolve(options.appBase, envFile);
  dotenv.config({path: envPath})
  var optionMapping = {  
    spHome: 'SP_HOME',
    port: 'PORT', 
    httpsPort: 'HTTPS_PORT', 
    cert: 'HTTPS_CERT', 
    key: 'HTTPS_KEY', 
    userName: 'SP_USER_NAME',
    password: 'SP_PASSWORD',
    build: 'NODE_ENV',
    appBase: 'SP_APP_BASE',
    distDir: 'SP_DIST_DIR',
    reloadPort: 'SP_RELOAD_PORT'
  };

  Object.keys(optionMapping).forEach(function(key) {
    if (options[key]) process.env[optionMapping[key]] = options[key];
  });
}

function closeServerOnTermination(server) {
  const terminationSignals = ['SIGINT', 'SIGTERM']
  terminationSignals.forEach(signal => {
    process.on(signal, () => {
      server.close()
      process.exit()
    })
  })
}
module.exports = Serve;