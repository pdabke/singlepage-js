/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
'use strict';
const fs = require('fs-extra');
const path = require('path');
const rollup = require('rollup');
const vue = require('rollup-plugin-vue');
const commonjs = require('rollup-plugin-commonjs');
const json = require('rollup-plugin-json');
const noderesolve = require('rollup-plugin-node-resolve');
const postcss = require('rollup-plugin-postcss');
const { terser } = require("rollup-plugin-terser");

const rootDir = path.resolve(__dirname, '..', '..');
const distDir = path.resolve(rootDir, 'dist');
const compDir = path.resolve(distDir, 'components');

fs.ensureDirSync(distDir);
fs.emptyDirSync(distDir);
fs.ensureDirSync(compDir);

var targets = [
  // Needed for service_tester utility used for testing Singlepage services
  {
    input: 
    {
      input: path.resolve(rootDir, 'lib', 'client', 'scripts', 'rpc.js'),
      plugins: [
        noderesolve(),
        commonjs(),
        json(),
        vue(),
        terser()
      ]
    },
    output: {
      format: 'umd',
      file:  path.resolve(distDir, 'rpc.umd.js'),
      name: 'SPRPC',
    }
  },

  // validator is loaded async by sp_app
  {
    input: {
      input: path.resolve(rootDir, 'lib', 'common', 'validator.js'),
      plugins: [
        noderesolve(),
        commonjs(),
        json(),
        vue(),
        terser()
      ]
    },
    output: {
      format: 'umd',
      file: path.resolve(distDir, 'validator.umd.js'),
      name: 'SPValidator',
    }
  },

  // portal_editor is loaded async by sp_app
  {
    input: {
      input: path.resolve(rootDir, 'lib', 'client', 'scripts', 'portal_editor.js'),
      plugins: [
        noderesolve(),
        commonjs(),
        json(),
        vue(),
        terser()
      ]
    },
    output: {
      format: 'umd',
      file: path.resolve(distDir, 'portal_editor.umd.js'),
      name: 'SPPortalEditor',
    }
  },

  // ESM build to be used with webpack/rollup.
  {
    input: {
      input: path.resolve(rootDir, 'lib', 'client', 'scripts', 'sp_app.js'),
      external: ["vue"],
      plugins: [
        noderesolve(),
        commonjs({sourceMap: false}),
        json(),
        vue()
        ]
    },
    output: {
      format: 'esm',
      file: path.resolve(distDir, 'splib.esm.js'),
      globals: {
        vue: "Vue"
      }
    }
  },

  // SP server to be included in application dist
  {
    input: {
      input: path.resolve(rootDir, 'lib', 'server', 'core', 'index.js'),
      plugins: [
        commonjs({ignore: [ 'conditional-runtime-dependency' ]}),
        json(),
        terser()
      ],
      external: ['fs', 'fs-extra', 'path', 'process', 'http', 'https', 'crypto', 
      'chokidar', 'mustache', 'lru-cache', 'formidable', 'nodemailer', 'mime-types', 'node-fetch']
    },
    output: {
      format: 'cjs',
      file: path.resolve(distDir, 'spserver.js'),
      /* Added exports: default to remove the following warning:

      Entry module "..\..\..\..\..\..\..\Projects\singlepage-js\lib\server\core\index.js"
       is implicitly using "default" export mode, which means for CommonJS output that 
       its default export is assigned to "module.exports". For many tools, such CommonJS
        output will not be interchangeable with the original ES module. If this is 
        intended, explicitly set "output.exports" to either "auto" or "default", otherwise
         you might want to consider changing the signature of 
         \..\Projects\singlepage-js\lib\server\core\index.js" to use named exports only.
*/
      exports: 'default'  
    }
  }

];

async function buildLib() {
  for (let i=0; i<targets.length; i++) {
    let bundle = await rollup.rollup(targets[i].input);
    await bundle.write(targets[i].output);
  }
}

async function buildComponent(inputFile, outputDir, name) {
  // create a bundle
  const bundle = await rollup.rollup({
    input: inputFile,
    plugins: [
      noderesolve({ mainFields: ['module', 'main'] }),
      commonjs({sourceMap: false}),
      json(),
      vue(),
      postcss(),
      terser()
    ]
  });

  // generate code in dist directory
  await bundle.write({
    format: 'umd',
    dir: outputDir,
    name: name
  });
  
}

function collectComponents(dir, comps) {
  var files = fs.readdirSync(dir);
  if (!files) return;
  for (let i=0; i<files.length; i++) {
    let file = path.resolve(dir, files[i]);
    if (fs.lstatSync(file).isDirectory()) {
      collectComponents(file, comps);
    } else {
      if (!file.endsWith('.vue')) continue;
      comps.push({ inputFile: file, name: 'Sp' + files[i].substring(0, files[i].length-4)});
    }
  }
}

async function buildComponents() {
  var comps = [];
  collectComponents(path.resolve(rootDir, 'lib', 'client', 'dynamic_components'), comps);
  for (let i=0; i<comps.length; i++) {
    let comp = comps[i];
    await buildComponent(comp.inputFile, compDir, comp.name);
  }
}

async function buildDist() {
  await buildLib();
  await buildComponents();
  fs.ensureDirSync(path.resolve(rootDir, 'dev', 'app_minimal', 'lib'));
  fs.copyFileSync(path.resolve(distDir, 'splib.esm.js'), path.resolve(rootDir, 'dev', 'app_minimal', 'lib', 'splib.esm.js'));

}
buildDist();
