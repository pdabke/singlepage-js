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
const parse5 = require('parse5');
const CommonConfig = require('../../lib/common/config');
const Util = require('../../lib/server/util/util');
const CommonUtil = require('../../lib/common/common_util');

const BuildUtil = {
  // We only want to copy config params that apply to client. These shared params are defined
  // in sp-home/common/config.js file
  createClientConfig(config) {
    if (!config) return {};
    var cconfig = {};
    Object.keys(CommonConfig).forEach(function(key) {
      cconfig[key] = CommonConfig[key];
      if (config[key]) cconfig[key] = config[key];
    });
    return cconfig;
  },

  createPageLayouts() {
    var loList = [];
    var lMap = {};
    processPageTemplates(path.resolve(process.env.SP_HOME, 'dev', 'resources', 'page_templates'), loList, lMap);
    processPageTemplates(path.resolve(process.env.SP_APP_BASE, 'src', 'templates'), loList, lMap);
    return { layoutList: loList, layoutMap: lMap };

  },

  createComponentMetadata() {
    var compMD = [];
    var compDir = path.resolve(process.env.SP_HOME, 'lib', 'client', 'components', "examples");
    registerComponents('Sp', compDir, '/components/examples', true, compMD);

    compDir = path.resolve(process.env.SP_HOME, 'lib', 'client', 'dynamic_components', "examples");
    registerComponents('Sp', compDir, '/spcomponents', false, compMD); 

    compDir = path.resolve(process.env.SP_APP_BASE, 'src', 'components');
    if (fs.existsSync(compDir)) {
      registerComponents('', compDir, '/components', false, compMD);
    }
    return compMD;
  },

  replaceAndCopy(inputDir, outputDir, origToken, replaceBy) {
    fs.ensureDirSync(outputDir);
    var files = fs.readdirSync(inputDir);
    for (let i=0; i<files.length; i++) {
      let content = fs.readFileSync(path.resolve(inputDir, files[i]), 'utf-8');
      content = content.replace(origToken, replaceBy);
      fs.writeFileSync(path.resolve(outputDir, files[i]), content);
    }
  }
  
};

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
  // Remove comments
  skDef = skDef.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
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
      if (CommonUtil.isFunction(val) && (val.name == 'Object' || val.name == 'Array')) {
        objectFields[key] = true;
      } else if (CommonUtil.isObject(val) && CommonUtil.isFunction(val.type) && (val.type.name == 'Object' || val.type.name == 'Array')) {
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
  var html = fs.readFileSync(filePath, 'utf-8');
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
module.exports = BuildUtil;