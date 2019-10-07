/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
const Sanitizer = require('html-sanitizer-p5');
const Constants = require('../../common/constants.js');
const Config = require('../core/server_config');
var FormUtil = {
  cleanseInputData(data, form) {
    var cleanData = {};
    cleanseInputDataHelper(form.fields, data, cleanData);
    return cleanData;
  },

  getFormData(form, data) {
    if (!data) data = {};
    getFormDataHelper(form.fields, data);
    return data;
  }

}

function cleanseInputDataHelper(fields, params, cleansedData) {
  var len = fields.length;
  for (let i=0; i<len; i++) {
    let ftype = fields[i].type;
    if (ftype == Constants.FORM_FIELD_GROUP) {
      this.cleanseInputDataHelper(fields[i].fields, params, cleansedData);
      continue;
    }
    let name = fields[i].name;
    let val = params[name];
    if (!val) continue;

    var dataType = fields[i].datatype;
    if (!ftype || ftype == Constants.FORM_FIELD_TEXT || ftype == Constants.FORM_FIELD_HIDDEN
    || ftype == Constants.FORM_FIELD_RADIO || 
    (ftype == Constants.FORM_FIELD_SELECT && !fields[i].multiple)) {
      cleansedData[name] = cleansePrimitiveData(val, dataType);  
    } else if (ftype == Constants.FORM_FIELD_TEXTAREA) {
      cleansedData[name] = val; // cleansedData[name] = He.escape(val);
    } else if (ftype == Constants.FORM_FIELD_HTML) {
      cleansedData[name] = Sanitizer.sanitize(val, {allowedTags: Config.HTML_TAGS_ALLOWED});
    } else if (ftype == Constants.FORM_FIELD_CHECKBOX && !Array.isArray(val)) {
      if (val) cleansedData[name] = true;
    } else if ((ftype == Constants.FORM_FIELD_SELECT || ftype == Constants.FORM_FIELD_CHECKBOX) && Array.isArray(val)) {
      let newVal = [];
      if (dataType == Constants.DATA_TYPE_FLOAT) {
        for (let j=0; j<val.length; j++) newVal.push(parseFloat(val[j]));
      } else if (dataType == Constants.DATA_TYPE_INT) {
        for (let k=0; k<val.length; k++) newVal.push(parseInt(val[k]));
      } else {
        newVal = val; // for (let l=0; l<val.length; l++) newVal.push(He.escape(val[l]));
      }
      cleansedData[name] = newVal;
    } else if (ftype == Constants.FORM_FIELD_FILE) {
      // Validation step must ensure that this file ID exists in the FileStore so we
      // don't do anything here
      cleansedData[name] = params[name];
    }
  }
}

function cleansePrimitiveData(val, dataType) {
  if (!dataType) return val; // return He.escape(val);
  else if (dataType == Constants.DATA_TYPE_INT) return parseInt(params[name]);
  else if (dataType == Constants.DATA_TYPE_FLOAT) return parseFloat(params[name]);     
  else return val; // return He.escape(val);
}

function getFormDataHelper(fields, data) {
  var len = fields.length;
  for (let i=0; i<len; i++) {
    let ftype = fields[i].type;
    if (ftype == Constants.FORM_FIELD_GROUP) {
      this.getFormDataHelper(fields[i].fields, data);
    } else if (fields[i].multiple || (ftype == Constants.FORM_FIELD_CHECKBOX && fields[i].options.length > 1)) {
      if (!data[fields[i].name]) data[fields[i].name] = [];
    }
  }
}
module.exports = FormUtil;