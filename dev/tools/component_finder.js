/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
'use strict';

var path = require('path');
var fs = require('fs-extra');
var root = path.resolve(__dirname, 'lib', 'client', 'components');
var ComponentFinder = {
  create() {
    var components = [];
    processDir(root, components, '', 'sp');
    var cFileContent = '';
    var compDir = '../components';
    for (let ii=0; ii<components.length; ii++) {
      cFileContent = cFileContent + 'import ' + components[ii][0] + ' from \'' + compDir + components[ii][1] + '\';\n';
    }
    cFileContent = cFileContent + 'export {\n'
    for (let ii=0; ii<components.length; ii++) {
      let comma = ii == (components.length-1) ? '' : ',';
      cFileContent = cFileContent + '  ' + components[ii][0] + comma + '\n';
    }
    cFileContent = cFileContent + '}\n';
    fs.writeFileSync(path.resolve(__dirname, 'lib', 'client', 'scripts', 'components.js'), cFileContent);
  }
}

function processDir(dir, comps, prefix, compPrefix) {
  var items = fs.readdirSync(dir);
  for (let i = 0; i < items.length; i++) {
    if (items[i].endsWith('.vue')) {
      let centry = [];
      let cname = 'Sp' + items[i].substring(0, items[i].length-4);
      centry.push(cname);
      centry.push(prefix + "/" + items[i]);
      comps.push(centry);
    } else if (fs.lstatSync(path.join(dir, items[i])).isDirectory()) {
      processDir(path.join(dir, items[i]), comps, prefix + "/" + items[i], compPrefix);
    }
  }
  return comps;
}

export default ComponentFinder;