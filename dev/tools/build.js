/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
const process = require('process');
const path = require('path');
const fs = require('fs-extra');
const toSource = require('tosource');
const parse5 = require('parse5');
const rollup = require('rollup');
const vue = require('rollup-plugin-vue');
const commonjs = require('rollup-plugin-commonjs');
const json = require('rollup-plugin-json');
const noderesolve = require('rollup-plugin-node-resolve');
const postcss = require('rollup-plugin-postcss');
const replace = require('rollup-plugin-replace');
const mustache = require('mustache');
const watcher = require('./watcher');
const CommonUtil = require('../../lib/common/common_util');
const Util = require('../../lib/server/util/util');
const BuildUtil = require('./build_util');

var _CONFIG = null;
var _CLIENT_CONFIG = null;
var _MESSAGES = null;
var _COMPONENT_TEMPLATES = {};
var _BUILD_OUTPUT = null;
var _APP_BASE = null;
var _OPTIONS = null;
var _SP_HOME = path.resolve(__dirname, '..', '..');
var _COMP_DIR = null;
var Build = {
  async handle(options) {
    _OPTIONS = options;
    if (options.isServe) {
      let validatorCode = fs.readFileSync(path.resolve(_SP_HOME, 'dist', 'validator.umd.js'), 'utf-8');
      let portalEditorCode = fs.readFileSync(path.resolve(_SP_HOME, 'dist', 'portal_editor.umd.js'), 'utf-8');
      let rpcCode = fs.readFileSync(path.resolve(_SP_HOME, 'dist', 'rpc.umd.js'), 'utf-8');

      _BUILD_OUTPUT = { 
        code: {
          "lib/validator.umd.js": validatorCode, 
          "lib/portal_editor.umd.js": portalEditorCode, 
          "lib/rpc.umd.js": rpcCode
        }, 
        components: {} };
      process.env.NODE_ENV = 'development';
      options.compress = false;
    } else {
      process.env.NODE_ENV = 'production';
    }
    _APP_BASE = options.appBase ? path.resolve(options.appBase) : path.resolve('.');
    if (!fs.existsSync(path.resolve(_APP_BASE, 'src'))) {
      console.error('Could not find src directory under the app directory. Are you sure you are invoking build from the right folder?');
      return;
    }
    options.appBase = _APP_BASE;
    process.env.SP_APP_BASE = _APP_BASE;
    process.env.SP_HOME = _SP_HOME;

    process.chdir(path.resolve(_APP_BASE));

    var distDir = path.resolve(_APP_BASE, 'dist');
    var distClientDir = path.resolve(_APP_BASE, 'dist', 'client');
    var distClientLibDir = path.resolve(distClientDir, 'lib')
    var distServerDir = path.resolve(_APP_BASE, 'dist', 'server');
    var distResourceDir = path.resolve(_APP_BASE, 'dist', 'server', 'resources');

    constructConfig(options);
    _MESSAGES = constructMessages(_CLIENT_CONFIG, _APP_BASE);
    _COMPONENT_TEMPLATES = constructComponentTemplates();
    var isProduction = process.env.NODE_ENV != 'development';

    if (!options.isServe) {
      if (fs.existsSync(distDir)) emptyDirWithExclusions(distDir, {".git": true, ".gitignore": true, ".npmignore": true, "Procfile": true});
      fs.ensureDirSync(distResourceDir);
      fs.ensureDirSync(distClientLibDir);

      // Copy assets
      /* Not needed since we moved all static files to assets directory
      let wwwDir = path.resolve(_APP_BASE, 'src', 'www');
      let fileList = fs.readdirSync(wwwDir);
      for (let ii = 0; ii < fileList.length; ii++) {
        let fileOrDir = fileList[ii];
        if (fileOrDir == 'index.html' || fileOrDir == 'login.html' || fileOrDir == 'logout.html' || fileOrDir == 'css') continue;
        fileOrDir = path.resolve(wwwDir, fileOrDir);
        fs.copySync(fileOrDir, path.resolve(distClientDir, fileList[ii]))
      }
*/
      // Copy the right .env file
      var envFile = isProduction ? path.resolve(_APP_BASE, '.env.production') : path.resolve(_APP_BASE, '.env.development');
      if (fs.existsSync(envFile)) fs.copyFileSync(envFile, path.resolve(distDir, '.env'));

      // Copy start script
      fs.ensureDirSync(path.resolve(distDir, 'bin'));
      fs.copySync(path.resolve(_SP_HOME, 'dev', 'resources', 'spstart.js'), path.resolve(distDir, 'bin', 'spstart.js'));
      
      // Generate HTML files
      var indexFile = path.resolve(_APP_BASE, 'src', 'www', 'index.html');
      if (!fs.existsSync(indexFile)) indexFile = path.resolve(_SP_HOME, 'dev', 'app_minimal', 'src', 'www', 'index.html' );
      distTemplate(indexFile, path.resolve(distClientDir, 'index.html'));
      fs.copySync(path.resolve(_APP_BASE, 'assets'), distClientDir);

      var serviceTesterContent = mustache.render(
        fs.readFileSync(path.resolve(_SP_HOME, 'dev', 'app_minimal', 'src', 'www', 'service_tester.html'), 'utf-8'), _CLIENT_CONFIG);
      
      fs.writeFileSync(path.resolve(distClientDir, 'service_tester.html'), serviceTesterContent);
      
      // Copy server to lib directory
      fs.ensureDirSync(path.resolve(distDir, 'lib'));
      fs.copySync(path.resolve(_APP_BASE, 'lib', 'spserver.js'), path.resolve(distDir, 'lib', 'spserver.js'));

      fs.copyFileSync(path.resolve(_SP_HOME, 'dist', 'rpc.umd.js'), path.resolve(distClientLibDir, 'rpc.umd.js'));
      fs.copyFileSync(path.resolve(_SP_HOME, 'dist', 'validator.umd.js'), path.resolve(distClientLibDir, 'validator.umd.js'));
      fs.copyFileSync(path.resolve(_SP_HOME, 'dist', 'portal_editor.umd.js'), path.resolve(distClientLibDir, 'portal_editor.umd.js'));

      // Copy sp components
      fs.copySync(path.resolve(_SP_HOME, 'dist', 'components'), path.resolve(distClientDir, 'spcomponents'));
    }

    // Generate lib & CSS
    var watchFiles = await buildLib(_APP_BASE, isProduction, options.isServe, distClientDir, options.compress);

    // Generate lib & CSS
    var watchFiles2 = await buildServiceWorker(_APP_BASE, isProduction, options.isServe, distClientDir, options.compress);

    // Build components
    var compDir = path.resolve(_APP_BASE, 'src', 'components');
    if (!fs.existsSync(compDir)) {
      console.warn('Missing components directory. Are you sure you are running build from root directory of your app?');
    } else {
      _COMP_DIR = compDir;
      var comps = fs.readdirSync(compDir);
      for (comp of comps) {
        await buildComponent(path.resolve(compDir, comp), path.resolve(distClientDir, 'components'),
          comp.substring(0, comp.length - 4), isProduction, options.isServe, options.compress);
      }
    }

    // Build Login and Logout components if found
    var loginComp = path.resolve(_APP_BASE, 'src', 'Login.vue');;
    if (fs.existsSync(loginComp)) {
      await buildComponent(loginComp, path.resolve(distClientDir, 'spcomponents'),
          'SpLogin', isProduction, options.isServe, options.compress);
    }
    var logoutComp = path.resolve(_APP_BASE, 'src', 'Logout.vue');;
    if (fs.existsSync(logoutComp)) {
      await buildComponent(logoutComp, path.resolve(distClientDir, 'spcomponents'),
          'SpLogout', isProduction, options.isServe, options.compress);
    }

    // Extract component metadata for components that can be added by a user to the portal
    Build.createComponentMetadata(_APP_BASE, distResourceDir, options.isServe);

    // Generate page templates file
    Build.createPageLayouts(distResourceDir, options.isServe);

    // Write/merge config.json overrides
    if (options.isServe) {
      _BUILD_OUTPUT.config = _CONFIG;
    } else {
      let appconfig = toSource(_CONFIG);
      fs.writeFileSync(path.resolve(distResourceDir, 'config.json'), appconfig);
    }

    // Email templates
    if (!options.isServe) {
      let tFile = path.resolve(options.appBase, 'src', 'templates', 'email_template.html');
      if (!fs.existsSync(tFile)) {
        tFile = path.resolve(_SP_HOME, 'dev', 'resources', 'email_templates', 'email_template.html');
      }
      fs.copyFileSync(tFile, path.resolve(distResourceDir, 'email_template.html'));

      tFile = path.resolve(options.appBase, 'src', 'templates', 'email_template.txt');
      if (!fs.existsSync(tFile)) {
        tFile = path.resolve(_SP_HOME, 'dev', 'resources', 'email_templates', 'email_template.txt');
      }
      fs.copyFileSync(tFile, path.resolve(distResourceDir, 'email_template.txt'))

    }

    // Services
    if (!options.isServe) {
      fs.copyFileSync(path.resolve(_APP_BASE, 'package.json'), path.resolve(distDir, 'package.json'));
      let serviceDir = path.resolve(distDir, 'server', 'services');
      fs.ensureDirSync(serviceDir);
      fs.copySync(path.resolve(options.appBase, 'server', 'services'), serviceDir);
    }
    if (options.isServe) {
      watcher.init(options, watchFiles, buildLibCB, buildCompCB, delCompCB);
    }

    // app definition file
    if (!options.isServe) {
      fs.copyFileSync(path.resolve(_APP_BASE, 'server', 'app.json'), path.resolve(distServerDir, 'app.json'));
      console.log("Distribution created in directory " + distDir);
      console.log("You can test your application by running spstart.js in " + path.resolve(distDir, 'bin'));
    }
    return _BUILD_OUTPUT;
  },
  
  createComponentMetadata(appDir, resourceDir, isServe) {
    var compMetadata = BuildUtil.createComponentMetadata();
    if (isServe) {
      let mdata = {};
      mdata.componentList = [];
      mdata.componentMap = {};
      mdata.componentSettings = {};
      for (let ii = 0; ii < compMetadata.length; ii++) {
        mdata.componentList.push(compMetadata[ii].metadata);
        mdata.componentMap[compMetadata[ii].metadata[0]] = compMetadata[ii].metadata;
        mdata.componentSettings[compMetadata[ii].metadata[0]] = compMetadata[ii].settings;
      }
      _BUILD_OUTPUT.componentMetadata = mdata;
      let chokidar = require('chokidar');
      var compWatcher = chokidar.watch(path.resolve(appDir, 'src', 'components'));
      compWatcher.on('ready', function () {
        compWatcher.on('add', addComponent)
          .on('change', updateComponent)
          .on('unlink', removeComponent);
      });

    } else {
      fs.writeFileSync(path.resolve(resourceDir, 'component_metadata.js'), 'module.exports = ' + toSource(compMetadata));
    }

  },

  createPageLayouts(resourceDir, isServe) {
    var pageLayouts = BuildUtil.createPageLayouts();
    if (isServe) {
      _BUILD_OUTPUT.code['page_layouts.json'] = JSON.stringify(pageLayouts);
    } else {
      fs.writeJSONSync(path.resolve(resourceDir, 'page_layouts.json'), pageLayouts)
    }

  }
  
}

async function buildComponent(inputFile, outputDir, outputFile, isProduction, isServe, compress) {
  // create a bundle
  const bundle = await rollup.rollup({
    treeshake: isProduction,
    input: inputFile,
    plugins: [
      noderesolve({ mainFields: ['module', 'main'] }),
      commonjs({sourceMap: false}),
      json(),
      vue(),
      postcss(),
      compress && (require('rollup-plugin-terser')).terser()
    ]
  });

  if (isServe) {
    // generate code in memory
    const { output } = await bundle.generate({ format: 'umd', name: outputFile });
    for (const chunkOrAsset of output) {
      _BUILD_OUTPUT.components[chunkOrAsset.fileName] = chunkOrAsset.code;
    }

  } else {
    // generate code in dist directory
    await bundle.write({
      format: 'umd',
      dir: outputDir,
      name: outputFile
      // sourcemap: !isProduction
    });
  }
}

async function buildServiceWorker(appBase, isProduction, isServe, distClientDir, compress) {
  // create a bundle
  var mainFile = path.resolve(appBase, 'src', 'service_worker.js');
  if (!fs.existsSync(mainFile)) return;
  var input = {
    treeshake: isProduction,
    input: mainFile,
    plugins: [
      replace({
        __CDN_URL__: _CLIENT_CONFIG.CDN_URL,
        __VERSION__: new Date().getTime()
      }),
      noderesolve(),
      commonjs({sourceMap: false}),
      compress && (require('rollup-plugin-terser')).terser()
    ]
  };

  var bundle = await rollup.rollup(input);
  if (isServe) {
    // generate code in memory
    const { output } = await bundle.generate({ format: 'cjs', file: 'service_worker.js' });
    for (const chunkOrAsset of output) {
      _BUILD_OUTPUT.code[chunkOrAsset.fileName] = chunkOrAsset.code ? chunkOrAsset.code : chunkOrAsset.source.toString();
    }
    return bundle.watchFiles;
  } else {
    // generate code in dist directory
    let libFileName = 'service_worker.js';
    await bundle.write({
      format: 'cjs',
      file: path.join(distClientDir, libFileName)
      //sourcemap: !isProduction
    });
  }

}
async function buildLib(appBase, isProduction, isServe, distClientDir, compress) {
  // create a bundle
  var mainFile = path.resolve(appBase, 'src', 'main.js');
  if (!fs.existsSync(mainFile)) mainFile = path.resolve(_SP_HOME, 'dev', 'src', 'main.js');
  var input = {
    treeshake: isProduction,
    input: mainFile,
    plugins: [

      replace({
        SP_CONFIG: JSON.stringify(_CLIENT_CONFIG),
        SP_MESSAGES: JSON.stringify(_MESSAGES),
        SP_COMPONENT_TEMPLATES: JSON.stringify(_COMPONENT_TEMPLATES),
        "process.env.NODE_ENV": JSON.stringify(isProduction ? 'production' : 'development'),
        "process.env.VUE_ENV": JSON.stringify('browser')
      }),

      noderesolve(),
      commonjs({sourceMap: false}),
      vue(),
      /* We now load CSS via Javascript. This may be a good idea regardless but the change was
       * forced by a bug in nanocss compression and normalization of background-position property.
       * It translates "center right" to "100% Calc(...)" which unfortunately results in a different
       * spacing. The workaround is to set normalizePositions to false but it only works when
       * CSS is loaded by JS. It does not work if extract is set to true since postcss does not
       * pass the configuration parameters to nanocss in that case. The symptom was seen in 
       * form validation icon positioning, the source is _forms.scss in bootstrap 4.3 source code.
       */
      postcss({
        extract: true,
        minimize: {
          preset: ['default', {normalizePositions: false}]
        }
      }),
      compress && (require('rollup-plugin-terser')).terser()
    ]
  };

  var bundle = await rollup.rollup(input);
  if (isServe) {
    // generate code in memory
    const { output } = await bundle.generate({ format: 'iife', file: 'spapp.js' });
    for (const chunkOrAsset of output) {
      _BUILD_OUTPUT.code['lib/' + chunkOrAsset.fileName] = chunkOrAsset.code ? chunkOrAsset.code : chunkOrAsset.source.toString();
    }
    return bundle.watchFiles;
  } else {
    // generate code in dist directory
    let libFileName = 'spapp.js';
    await bundle.write({
      format: 'iife',
      file: path.join(distClientDir, 'lib', libFileName)
      //sourcemap: !isProduction
    });
  }

}
function distTemplate(src, dest) {
  var content = fs.readFileSync(src, 'utf-8');
  content = mustache.render(content, _CONFIG);
  fs.writeFileSync(dest, content);
}

function constructConfig(options) {

  var config = { CDN_URL: '/sp-files' };
  if (options.distDir) {
    let distConfig = path.resolve(options.distDir, 'server', 'resources', 'config.json');
    let configContent = fs.readFileSync(distConfig, 'utf-8');
    distConfig = eval('(' + configContent + ")");
    _CONFIG = distConfig;
    _CLIENT_CONFIG = BuildUtil.createClientConfig(_CONFIG);
    return;
  }
  var configFile = path.resolve(options.appBase, 'config.json');
  if (fs.existsSync(configFile)) {
    try {
      let configContent = fs.readFileSync(configFile, 'utf-8');
      config = eval('(' + configContent + ")");
      if (!config.CDN_URL) config.CDN_URL = '/sp-files';
      } catch (e) {
      console.error('Invalid config.json file.');
      console.error(e);
    }
  }

  var isProduction = options.build == 'production';
  var configOverride = isProduction ? 'config.production.json' : 'config.development.json';
  configFile = path.resolve(options.appBase, configOverride);
  if (fs.existsSync(configOverride)) {
    try {
      let configContent = fs.readFileSync(configOverride, 'utf-8');
      let ovr = eval('(' + configContent + ")");
      Object.assign(config, ovr);
    } catch (e) {
      console.error('Invalid ' + configOverride + ' file.');
      console.error(e);
    }
  }

  _CONFIG = config;
  _CLIENT_CONFIG = BuildUtil.createClientConfig(_CONFIG);
}

function constructMessages(config, appDir) {
  var locale = config.LOCALE ? config.LOCALE : 'en-US';
  var msgs = {};
  if (fs.existsSync(path.resolve(_SP_HOME, 'lib', 'client', 'locales', 'messages_' + locale + '.json'))) {
    msgs = fs.readJSONSync(path.resolve(_SP_HOME, 'lib', 'client', 'locales', 'messages_' + locale + '.json'));
  } else {
    msgs = fs.readJSONSync(path.resolve(_SP_HOME, 'lib', 'client', 'locales', 'messages_en-US.json'));
  }
  let customMessageFile = path.resolve(appDir, 'src', 'locales', 'messages_' + locale + '.json');
  if (fs.existsSync(customMessageFile)) {
    let appMsgs = fs.readJSONSync(customMessageFile);
    Object.assign(msgs, appMsgs);
  }
  return msgs;
}

function constructComponentTemplates() {

  var tFile = path.resolve(_APP_BASE, 'src', 'templates', 'component_templates.json');
  if (fs.existsSync(tFile)) {
    try {
      return fs.readJSONSync(tFile);
    } catch (e) {
      console.error('Invalid component_templates.json file.');
      console.error(e);
    }
  }
  return {};

}

async function buildLibCB(path) {
  try {
    constructConfig(_OPTIONS);
    _MESSAGES = constructMessages(_CLIENT_CONFIG, _APP_BASE);
    _COMPONENT_TEMPLATES = constructComponentTemplates();
    //console.log('Rebuilding lib: ' + path);
    await buildLib(_APP_BASE, false, true, null);
  } catch (e) {
    console.error(e);
  }
}

async function buildCompCB(p) {
  try {
    var comp = path.basename(p);
    comp = comp.substring(0, comp.length - 4);
    await buildComponent(p, null, comp, false, true);
  } catch (e) {
    console.error(e);
  }
}

function delCompCB(p) {
  var comp = path.basename(p);
  comp = comp.substring(0, comp.length - 3) + 'js'
  _BUILD_OUTPUT.components[comp] = undefined;
}

function processPageTemplates(tDir, loList, lMap) {
  if (!fs.existsSync(tDir)) return;
  var fileList = fs.readdirSync(tDir);
  for (let ii = 0; ii < fileList.length; ii++) {
    let fileName = fileList[ii];
    if (fileName.startsWith('page_')) {
      var loName = fileName.substring(5);
      loName = loName.substring(0, loName.indexOf('.'));
      let label = Util.toTitleCase(loName, true);
      // App developers can overwrite built-in layout definitions
      if (!lMap[loName]) {
        loList.push({ value: loName, label: label });
      }
      lMap[loName] = htmlToJson(path.resolve(tDir, fileName));
    }
  }
}

function getComponentMetadata(appBase) {
  var compMD = [];
  var compDir = path.resolve(_SP_HOME, 'lib', 'client', 'components', "examples");
  //console.log('Initializing built-in components from directory: ' + compDir);
  registerComponents('Sp', compDir, '/components/examples', true, compMD);

  compDir = path.resolve(appBase, 'src', 'components');
  if (fs.existsSync(compDir)) {
    //console.log('Processing app components from directory: ' + compDir);
    registerComponents('', compDir, '/components', false, compMD);
  }
  return compMD;
}

function registerComponents(prefix, compDir, accessPath, preLoaded, compMD) {
  var items = fs.readdirSync(compDir);
  for (let i = 0; i < items.length; i++) {
    addComponentHelper(prefix, compDir, accessPath, preLoaded, items[i], compMD);
  }
}

function addComponentHelper(prefix, compDir, accessPath, preLoaded, comp, compMD) {
  if (comp.endsWith('.vue')) {
    let elem = [];
    elem[0] = prefix + comp.substring(0, comp.length - 4).replace(/_/g, '-');
    elem[1] = accessPath + '/' + comp.replace('.vue', '.js');
    elem[2] = preLoaded;
    let md = loadComponent(compDir, comp, prefix);
    elem[3] = md.props;
    compMD.push({ metadata: elem, settings: md.settings });
  }

}

function loadComponent(compDir, sk, prefix) {
  //console.log('Processing component: ' + sk);
  var md = { props: null, settings: null };
  if (!prefix) prefix = '';
  var skDef = fs.readFileSync(compDir + '/' + sk, 'utf-8');
  var re = /<\s*script\s*>/;
  var match = re.exec(skDef);
  if (match) skDef = skDef.substring(match.index);

  var settings = extractField(skDef, "settings");
  var props = extractField(skDef, "props");

  if (settings) {
    md.settings = settings;
  } else {
    if (props) {
      md.settings = CommonUtil.createPropsForm(props);
    }
  }

  if (!props) return md;
  // objectFields is collecting object properties of non-string types which will need a type conversion
  // when they are set on the component. See Component.vue to understand how this is used.
  var objectFields = {};
  if (!Array.isArray(props)) {
    Object.keys(props).forEach(function (key) {
      let val = props[key];
      if (!val) return;
      if (CommonUtil.isFunction(val) && val.name == 'Object') {
        objectFields[key] = true;
      } else if (Util.isObject(val) && CommonUtil.isFunction(val.type) && val.type.name == 'Object') {
        objectFields[key] = true;
      }
    });
  }
  if (Object.keys(objectFields) && Object.keys(objectFields).length > 0) md.props = objectFields;
  return md;
}

function extractField(code, fieldName) {
  // console.log(code);
  try {
    var re = new RegExp(fieldName + "\\s*:\\s*{", "g");
    var match = re.exec(code);
    if (match) {
      code = code.substring(match.index);
      let index = code.indexOf('{');
      code = code.substring(index);
      return extractObject(code, "{", "}");
    } else {
      re = new RegExp(fieldName + "\\s*:\\s*\\[", "g");
      match = re.exec(code);
      if (match) {
        let index = code.indexOf('[');
        code = code.substring(index);
        return extractObject(code, "[", "]");
      }
    }
    return null;
  } catch (e) {
    console.error(e);
    return null;
  }
}

function extractObject(code, open, close) {
  var index = -1;
  var openBraces = 1;
  for (let i = 1; i < code.length; i++) {
    let c = code.charAt(i);
    if (c == open) {
      openBraces = openBraces + 1;
    } else if (c == close) {
      openBraces = openBraces - 1;
      if (openBraces == 0) {
        index = i;
        break;
      }
    }
  }
  if (index == -1) return null;
  code = code.substring(0, index + 1);
  return eval('(  ' + code + ')');

}

function htmlToJson(filePath) {
  var html = fs.readFileSync(filePath, 'UTF-8');
  let df = parse5.parseFragment(html);
  let json = [];
  let id = [];
  id[0] = 100;
  df.childNodes.forEach(function (node, index) {
    let c = htmlToJsonHelper(node, id);
    if (c) json.push(c);
  });
  return json;
}

function htmlToJsonHelper(node, id) {
  if (!node.tagName) return null;
  let container = {};
  container.id = id[0];
  id[0] = id[0] + 1;
  container.components = [];
  container.tagName = node.tagName;
  if (node.attrs) {
    node.attrs.forEach(function (attr, index) { container[attr.name] = attr.value; })
  }
  let subC = [];
  if (node.childNodes) {
    node.childNodes.forEach(function (sc, index) {
      let c = htmlToJsonHelper(sc, id);
      if (c) subC.push(c);
    });
  }
  container.containers = subC;
  return container;
}

function addComponent(p) {
  try {
    var comp = path.basename(p);
    var compMD = [];
    addComponentHelper("", path.dirname(p), '/components', false, comp, compMD);
    if (compMD.length == 1) {
      let md = compMD[0];
      _BUILD_OUTPUT.componentMetadata.componentList.push(md.metadata);
      _BUILD_OUTPUT.componentMetadata.componentMap[md.metadata[0]] = md.metadata;
      _BUILD_OUTPUT.componentMetadata.componentSettings[md.metadata[0]] = md.settings;

    }
  } catch (e) {
    console.error(e);
  }
}

function updateComponent(p) {
  try {
    var comp = path.basename(p);
    var md = loadComponent(_COMP_DIR, comp, '');
    var compName = comp.substring(0, comp.length - 4).replace(/_/g, '-');
    var compInfo = _BUILD_OUTPUT.componentMetadata.componentMap[compName];
    compInfo[3] = md.props;
    _BUILD_OUTPUT.componentMetadata.componentSettings[compName] = md.settings;
  } catch (e) {
    console.error(e);
  }
}

function removeComponent(p) {
  var index = -1;
  var comp = path.basename(p);
  comp = comp.substring(0, comp.length - 4).replace(/_/g, '-');

  for (let ii = 0; ii < _BUILD_OUTPUT.componentMetadata.componentList.length; ii++) {
    if (_BUILD_OUTPUT.componentMetadata.componentList[ii][0] == comp) {
      index = ii;
      break;
    }
  }
  if (index > -1) {
    _BUILD_OUTPUT.componentMetadata.componentList.splice(index, 1);
    _BUILD_OUTPUT.componentMetadata.componentMap[comp] = undefined;
  }

}

function emptyDirWithExclusions(dir, exclusions) {
  if (!fs.existsSync(dir)) return;
  var files = fs.readdirSync(dir);
  if (!files) return;
  for (let i=0; i<files.length; i++) {
    if (exclusions[files[i]]) continue;
    let f = path.resolve(dir, files[i]);
    if (fs.lstatSync(f).isDirectory()) {
      fs.emptyDirSync(f);
      fs.rmdirSync(f);
    } else {
      fs.unlinkSync(f);
    }

  }

}
module.exports = Build;