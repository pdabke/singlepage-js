/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
import process from 'process';
import path from 'path';
import fs from 'fs-extra';
import vue from 'rollup-plugin-vue';
import replace from 'rollup-plugin-replace';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import noderesolve from 'rollup-plugin-node-resolve';
import copy from 'rollup-plugin-copy';
import { terser } from "rollup-plugin-terser";
import postcss from 'rollup-plugin-postcss';
import livereload from 'rollup-plugin-livereload'
import mustache from 'mustache';
import tosource from 'tosource';
import ComponentFinder from './dev/tools/component_finder';
const BuildUtil = require('./dev/tools/build_util');

process.env.SP_HOME = path.resolve(__dirname);
process.env.SP_APP_BASE = path.resolve(__dirname, 'dev', 'app_minimal');

var devDistDir = path.resolve(__dirname, 'dev', 'dist');
fs.ensureDirSync(devDistDir);
fs.emptyDirSync(devDistDir);

// Copy start script
fs.ensureDirSync(path.resolve(devDistDir, 'bin'));
fs.copySync(path.resolve(process.env.SP_HOME, 'dev', 'resources', 'spstart.js'), path.resolve(devDistDir, 'bin', 'spstart.js'));

var config = fs.readJSONSync(path.resolve(__dirname, 'dev', 'app_minimal', 'config.json'));
// CDN_URL is needed for substitutions in index.html template
if (!config.CDN_URL) config.CDN_URL = '/sp-files';
var clientConfig = BuildUtil.createClientConfig(config);
var locale = config.LOCALE ? config.LOCALE : 'en-US';
var messages = fs.readJSONSync(path.resolve('.', 'lib', 'client', 'locales', 'messages_' + locale + '.json'));

var indexFileContent = mustache.render(
  fs.readFileSync(path.resolve(__dirname, 'dev', 'app_minimal', 'src', 'www', 'index.html'), 'utf-8'), 
  config);
fs.ensureDirSync(path.resolve(devDistDir, 'client'));
fs.writeFileSync(path.resolve(devDistDir, 'client', 'index.html'), indexFileContent);

var serviceTesterContent = mustache.render(
  fs.readFileSync(path.resolve(__dirname, 'dev', 'app_minimal', 'src', 'www', 'service_tester.html'), 'utf-8'), clientConfig);

fs.writeFileSync(path.resolve(devDistDir, 'client', 'service_tester.html'), serviceTesterContent);

fs.ensureDirSync(path.resolve(devDistDir, 'server', 'resources'));

// Page layouts
fs.writeFileSync(path.resolve(devDistDir, 'server', 'resources', 'page_layouts.json'), JSON.stringify(BuildUtil.createPageLayouts()));

// Component metadata
fs.writeFileSync(path.resolve(devDistDir, 'server', 'resources', 'component_metadata.js'), 
  'module.exports = ' + tosource(BuildUtil.createComponentMetadata()));

// Build dynamically loaded system components
var systemComps = [];
createSystemComponentList(path.resolve(__dirname, 'lib', 'client', 'dynamic_components'), systemComps);

// Build app components
var compDir = path.resolve(__dirname, 'dev', 'app_minimal', 'src', 'components');
var comps = fs.readdirSync(compDir);
for (let i=0; i<comps.length; i++) comps[i] = path.resolve(compDir, comps[i]);

// Service files
fs.copySync(path.resolve(__dirname, 'dev', 'app_minimal', 'server', 'services'), 
path.resolve(devDistDir, 'server', 'services'));
/*
var st = fs.readFileSync(path.resolve(__dirname, 'dev', 'app_minimal', 'src', 'www', 'service_tester.html'), 'utf-8');
st = st.replace(/SP_CONFIG/g, JSON.stringify(config));
fs.writeFileSync(path.resolve(__dirname, 'dist', 'service_tester.html'), st);
*/
ComponentFinder.create();
var isWatchMode = process.argv.includes('-w');
var targets = [
  // Needed for service_tester utility used for testing Singlepage services
  {
    input: 'lib/client/scripts/rpc.js',
    output: {
      format: 'umd',
      file: 'dev/dist/client/lib/rpc.umd.js',
      name: 'SPRPC',
    },
    plugins: [
      noderesolve(),
      commonjs(),
      json(),
      vue(),
      terser()
    ]
  },

  // validator is loaded async by sp_app
  {
    input: 'lib/common/validator.js',
    output: {
      format: 'umd',
      file: 'dev/dist/client/lib/validator.umd.js',
      name: 'SPValidator',
    },
    plugins: [
      noderesolve(),
      commonjs(),
      json(),
      vue(),
      terser()
    ]
  },

  // portal_editor is loaded async by sp_app
  {
    input: 'lib/client/scripts/portal_editor.js',
    output: {
      format: 'umd',
      file: 'dev/dist/client/lib/portal_editor.umd.js',
      name: 'SPPortalEditor',
    },
    plugins: [
      noderesolve(),
      commonjs(),
      json(),
      vue(),
      terser()
    ]
  },

  // ESM build to be used with webpack/rollup.
  {
    input: 'lib/client/scripts/sp_app.js',
    output: {
      format: 'esm',
      file: 'dev/app_minimal/lib/splib.esm.js',
      globals: {
        vue: "Vue"
      }
    },
    external: ["vue"],
    plugins: [
      noderesolve(),
      commonjs(),
      json(),
      vue()
    ]
  },

  // Build mimimal app for internal testing

  {
    input: 'dev/app_minimal/src/main.js',
    output: {
      format: 'iife',
      file: 'dev/dist/client/lib/spapp.js'
    },
    plugins: [
      replace({
        SP_CONFIG: JSON.stringify(clientConfig),
        SP_MESSAGES: JSON.stringify(messages),
        "process.env.NODE_ENV": JSON.stringify('development'),
        "process.env.VUE_ENV": JSON.stringify('browser')
      }),
      copy({
        targets: [
          { src: 'dev/app_minimal/assets/*', dest: 'dev/dist/client' },
          { src: 'dev/app_minimal/config.json', dest: 'dev/dist'},
          { src: 'dev/app_minimal/server/app.json', dest: 'dev/dist/server'},
          { src: 'dev/resources/email_templates/email_template.html', dest: 'dev/dist/server/resources'},
          { src: 'dev/resources/email_templates/email_template.txt', dest: 'dev/dist/server/resources'},
          { src: 'dev/app_minimal/lib/*', dest: 'dist'}
         ]
      }),
      noderesolve(),
      commonjs(),
      json(),
      vue(),
      postcss({
        extract: true,
        minimize: true
      }),
      isWatchMode && livereload({})

      ,terser()
    ]
  },
  {
    input: 'lib/server/core/index.js',
    output: {
    format: 'cjs',
    file: 'dev/dist/lib/spserver.js'
    },
    plugins: [
      commonjs({ignore: [ 'conditional-runtime-dependency' ]}),
      json()
      ],
    external: ['fs', 'path', 'process', 'http', 'https', 'crypto', 'chokidar', 'mustache', 'lru-cache', 'formidable', 'nodemailer', 'mime-types']
  }
];

// Built-in SP components loaded dynamically
for (let i=0; i<systemComps.length; i++) {
  createComponentRollup(systemComps[i], 'dev/dist/client/spcomponents', targets, 'Sp');
}

// Client components
for (let i=0; i<comps.length; i++) {
  createComponentRollup(comps[i], 'dev/dist/client/components', targets, '');
}

function createSystemComponentList(dir, comps) {
  let files = fs.readdirSync(dir);
  for (let i=0; i<files.length; i++) {
    let fpath = path.resolve(dir, files[i]);
    if (fs.lstatSync(fpath).isDirectory()) {
      createSystemComponentList(fpath, comps);
    } else if (fpath.endsWith('.vue')) {
      comps.push(fpath);
    }
  }
}

function createComponentRollup(compPath, targetDir, targets, prefix) {
  let comp = path.basename(compPath);
  comp = comp.substring(0, comp.length - 4);
  targets.push(
  {
    input: compPath,
    output: {
      format: 'umd',
      dir: targetDir,
      name: prefix + comp
    },

    plugins: [
      noderesolve({ mainFields: ['module', 'main'] }),
      commonjs(),
      json(),
      vue()
    ]
  }
  );
}
export default targets;
