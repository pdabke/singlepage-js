/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
/* Updates Singlepage.js runtime libraries and package.json to the current version */
'use strict'
const child_process = require('child_process');
const process = require('process');
const path = require('path');
const fs = require('fs-extra');
const _SP_HOME = path.resolve(__dirname, '..', '..');
var Update = {
  handle(dir, options) {
    dir = path.resolve(dir);
    if (fs.existsSync(dir)) {
      if (!fs.lstatSync(dir).isDirectory()) {
        console.log('Expected directory, got a file.');
        return;
      }
      if (!fs.existsSync(path.resolve(dir, 'lib'))) {
        console.log('Did not find lib folder under app directory.');
        return;
      }
    } else {
      console.log('App directory does not exist')
    }
    console.log('Updating singlepage runtime in ' + dir);
    fs.copyFileSync(path.resolve(_SP_HOME, 'dist', 'spserver.js'), path.resolve(dir, 'lib', 'spserver.js'));
    fs.copyFileSync(path.resolve(_SP_HOME, 'dist', 'splib.esm.js'), path.resolve(dir, 'lib', 'splib.esm.js'));

    // Update package.json file if needed
    var systemPkg = fs.readJSONSync(path.resolve(_SP_HOME, 'dev', 'resources', 'package.json'), 'utf-8')['dependencies'];
    var appPkgJson = fs.readJSONSync(path.resolve(dir, 'package.json'), 'utf-8');
    var appPkg = appPkgJson['dependencies']
    var changed = false;
    Object.keys(systemPkg).forEach(function(key) {
      if (appPkg[key]) {
        if (appPkg[key] != systemPkg[key]) {
          console.log(key + ' version required: ' + systemPkg[key] + ', found: ' + appPkg[key]);
        }
      } else {
        appPkg[key] = systemPkg[key];
        console.log('Adding missing package ' + key + ' to package.json');
        changed = true;
      }
    });
    if (changed) fs.writeJSONSync(path.resolve(dir, 'package.json'), appPkgJson);
    
    // install packages if needed
    if (changed) {
      console.log('Running npm install to install missing packages.');
      process.chdir(dir);
      child_process.execSync('npm install', {stdio: 'inherit'});
    }
    console.log('Singlepage runtime updated.')
  }
}

module.exports = Update;