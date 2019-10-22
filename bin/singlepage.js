#!/usr/bin/env node

'use strict';
var process = require('process');
var program = require('commander');
var Create = require('../dev/tools/create');
var Build = require('../dev/tools/build');
var Serve = require('../dev/tools/serve');
program
  .command('create <app-name>')
  .option('-f, --full', 'Create sample app files that override built-in functionality. If unspecified only minimal skeleton is generated.')
  .action(Create.handle);

program
  .command('build')
  .option("--no-compress", "Create source map", )
  .action(Build.handle);

program
  .command('serve')
  .option("-p, --port <port>", "HTTP port")
  .option("-P, --https-port <port>", "HTTPS port")
  .option("-c, --cert <cert-file>", "HTTPS cert file")
  .option("-k, --key <key-file>", "HTTPS key file")
  .option("-a, --app-base <app-base>", "Appliction root directory")
  .action(Serve.handle);

program.parse(process.argv);
