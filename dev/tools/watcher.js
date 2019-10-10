/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
const path = require('path');
const chokidar = require('chokidar');
var _SPSERVER = null;
var _LIB_FILE_WATCHER = null;
var _INDEX_WATCHER = null;
var _SERVICE_WATCHER = null;
var _BUILD_LIB_CB = null;
var Watcher = {
  init(options, watchFiles, libCB, buildCompCB, delCompCB) {
    _BUILD_LIB_CB = libCB;
    _SPSERVER = options.spServer;
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

    // Watch index file changes
    var indexFilePath = path.resolve(process.env.SP_APP_BASE, 'src', 'www')
    _INDEX_WATCHER = chokidar.watch(indexFilePath);
    _INDEX_WATCHER.on('ready', function () {
      _INDEX_WATCHER.on('change', function () {
          _SPSERVER.reloadIndexFile();
        })
      });

    // Watch service files changes
    _SERVICE_WATCHER = chokidar.watch(path.resolve(process.env.SP_APP_BASE, 'server', 'services'));
    _SERVICE_WATCHER.on('ready', function() {
      _SERVICE_WATCHER.on('add', function(path) { _SPSERVER.serviceChanged(path, 'add'); })
        .on('change', function(path) { _SPSERVER.serviceChanged(path, 'change'); })
    .on('unlink', function(path) { _SPSERVER.serviceChanged(path, 'unlink'); });
    });
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