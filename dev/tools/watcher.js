/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
const path = require('path');
const chokidar = require('chokidar');
var _LIB_FILE_WATCHER = null;
var _BUILD_LIB_CB = null;
var Watcher = {
  init(options, watchFiles, libCB, buildCompCB, delCompCB) {
    _BUILD_LIB_CB = libCB;
    console.log('Running in watch mode');

    var compWatcher = chokidar.watch(path.resolve(options.appBase, 'src', 'components'));
    compWatcher.on('ready', function () {
      compWatcher.on('add', buildCompCB)
        .on('change', buildCompCB)
        .on('unlink', delCompCB);

    });

    if (watchFiles) {
      this.updateWatchFiles(filterWatchFiles(watchFiles));
    }
  },
  updateWatchFiles(watchFiles) {
    var wf = filterWatchFiles(watchFiles);
    if (_LIB_FILE_WATCHER) _LIB_FILE_WATCHER.close();
    _LIB_FILE_WATCHER = chokidar.watch(wf);
    _LIB_FILE_WATCHER.on('ready', function () {
      _LIB_FILE_WATCHER.on('add', _BUILD_LIB_CB)
        .on('change', _BUILD_LIB_CB)
        .on('unlink', _BUILD_LIB_CB);
    });
  }
};

function filterWatchFiles(watchFiles) {
  var wf = [];
  for (let ii=0;ii<watchFiles.length; ii++) {
    let file = watchFiles[ii];
    if (!file.includes('?') && !file.includes('node_modules') && !file.startsWith('\u0000')) {
      wf.push(file);
    }
  }
  return wf;
}
module.exports = Watcher;