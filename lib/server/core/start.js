const dotenv = require('dotenv');
const path = require('path');
const _DIST_DIR = path.resolve(__dirname, '..', '..', '..', 'dev', 'dist');
dotenv.config({path: path.resolve(_DIST_DIR, '.env')});
const fs = require('fs');
const process = require('process');
const Server = require('./server');


process.env.SP_DIST_DIR = _DIST_DIR;
var config = {};
var configFile =  path.resolve(_DIST_DIR, 'config.json');
if (fs.existsSync(configFile)) {
  var content = fs.readFileSync(configFile, 'utf-8');
  config = eval('(' + content + ")");
}

Server.start(config);
