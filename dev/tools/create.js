/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
'use strict'
const child_process = require('child_process');
const process = require('process');
const path = require('path');
const fs = require('fs-extra');
const _SP_HOME = path.resolve(__dirname, '..', '..');
var Create = {
  handle(dir, options) {
    var pkgRegex = new RegExp("^(?:@[a-z0-9-~][a-z0-9-._~]*/)?[a-z0-9-~][a-z0-9-._~]*$");
    if (! pkgRegex.test(dir)) {
      console.error('Invalid application name.');
      return;
    }
    dir = path.resolve(dir);
    if (fs.existsSync(dir)) {
      if (!fs.lstatSync(dir).isDirectory()) {
        console.log('Expected directory, got a file.');
        return;
      }
      if (fs.readdirSync(dir).length != 0) {
        console.log('Directory is not empty');
        return;
      }
    } else {
      fs.ensureDirSync(path.resolve(dir, 'lib'));
    }
    console.log('Creating singlepage app in ' + dir);
    fs.copySync(path.resolve(_SP_HOME, 'dev', 'app_minimal'), dir);
    fs.copyFileSync(path.resolve(_SP_HOME, 'dist', 'spserver.js'), path.resolve(dir, 'lib', 'spserver.js'));
    fs.copyFileSync(path.resolve(_SP_HOME, 'dist', 'splib.esm.js'), path.resolve(dir, 'lib', 'splib.esm.js'));

    if (options.full) {
      fs.copySync(path.resolve(_SP_HOME, 'dev', 'app_full'), dir);
      fs.copyFileSync(path.resolve(_SP_HOME, 'lib', 'client', 'components', 'App.vue'),
        path.resolve(dir, 'src', 'App.vue'));
      fs.copyFileSync(path.resolve(_SP_HOME, 'lib', 'client', 'dynamic_components', 'portal', 'Login.vue'),
        path.resolve(dir, 'src', 'Login.vue'));
      fs.copyFileSync(path.resolve(_SP_HOME, 'lib', 'client', 'dynamic_components', 'portal', 'Logout.vue'),
        path.resolve(dir, 'src', 'Logout.vue'));
      fs.copyFileSync(path.resolve(_SP_HOME, 'lib', 'client', 'components', 'portal', 'PageNotFound.vue'),
      path.resolve(dir, 'src', 'PageNotFound.vue'));
    }
    // Create package.json file
    var pkg = fs.readFileSync(path.resolve(_SP_HOME, 'dev', 'resources', 'package.json'), 'utf-8');
    pkg = pkg.replace('sp-app-name', path.basename(dir));
    fs.writeFileSync(path.resolve(dir, 'package.json'), pkg);
    
    // install packages needed by singlepage server
    console.log('Installing packages...');
    process.chdir(dir);
    child_process.execSync('npm install', {stdio: 'inherit'});

    console.log('Singlepage starter app created successfully.')
  }
}

function install_pkg(pkgName, options) {
  try {
    if (!options) options = '';
    else options = ' ' + options;
    child_process.execSync('npm install ' + pkgName + options, {stdio: 'inherit'});
  } catch (e) {
    console.error('Failed to install ' + pkgName);
    console.error(e);
  }
}

module.exports = Create;