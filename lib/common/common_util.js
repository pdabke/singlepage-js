/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
'use strict';
const Constants = require('./constants');
var CommonUtils = {
  createPropsForm(props) {
    if (!props) return;
    if (Array.isArray(props)) return createPropsFormFromArray(props);
    else return createPropsFormFromObject(props);
  },

  isObject: function (val) {
    if (!val) return false;
    return typeof val === 'object' && !Array.isArray(val);
  },

  isFunction: function (val) {
    return val && {}.toString.call(val) === '[object Function]';
  }
}


function createPropsFormFromArray(props) {
  var form = {};
  var flds = [];
  form.fields = flds;
  for (let ii = 0; ii < props.length; ii++) {
    let prop = props[ii];
    let f = {};
    f.name = prop;
    f.type = 'text';
    f.label = prop;
    flds.push(f);
  }
  return form;
}

function createPropsFormFromObject(props) {
  let form = {};
  let fields = [];
  form.fields = fields;
  Object.keys(props).forEach(function (key) {
    let val = props[key];
    if (!val) return;
    let f = {};
    f.name = key;
    f.label = key;
    if (CommonUtils.isFunction(val)) {
      if (!val.name) return;
      if (!['String', 'Number', 'Boolean', 'Object', 'Array'].includes(val.name)) return;
      f.type = computeFieldType(val);
      f.dataType = computeFieldDataType(val);
    }
    else if (CommonUtils.isObject(val)) {
      f.type = computeFieldType(val.type);
      f.dataType = computeFieldDataType(val.type);
      f.required = val.required;
      if (val.validator) {
        f.propValidator = val.validator;
      }
    }
    else if (Array.isArray(val)) {
      f.type = Constants.FORM_FIELD_TEXTAREA;
    }

    fields.push(f);

  });
  return form;
}

function computeFieldType(val) {
  if (!val) return Constants.FORM_FIELD_TEXT
  else if (val.name == 'Object') return Constants.FORM_FIELD_TEXTAREA;
  else if (val.name == 'Date') return Constants.FORM_FIELD_TIMESTAMP;
  else if (val.name == 'Boolean') return Constants.FORM_FIELD_CHECKBOX;
  else return Constants.FORM_FIELD_TEXT;
}

function computeFieldDataType(val) {
  if (!val) return undefined
  else if (val.name == 'Number') return Constants.DATA_TYPE_FLOAT;
  else if (val.name == 'Object') return Constants.DATA_TYPE_OBJECT;
  else if (val.name == 'Array') return Constants.DATA_TYPE_ARRAY;
  else return undefined;
}

module.exports = CommonUtils;