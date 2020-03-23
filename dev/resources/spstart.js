#!/usr/bin/env node
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({path: path.resolve(__dirname, '..', '.env')});
const fs = require('fs');
const process = require('process');
const { Server } = require('../lib/spserver');

const _DIST_DIR = path.resolve(__dirname, '..');

process.env.SP_DIST_DIR = _DIST_DIR;
var config = {};
var configFile =  path.resolve(_DIST_DIR, 'server', 'resources', 'config.json');
if (fs.existsSync(configFile)) {
  var content = fs.readFileSync(configFile, 'utf-8');
  config = eval('(' + content + ")");
}

Server.start(config);
