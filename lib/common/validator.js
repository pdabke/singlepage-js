/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
'use strict';
const Constants = require('./constants.js');

var SPValidator = {
  emailRegex: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  urlRegex: /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi,

  isValidUSPhone: function (value) {
    return value.match(/\d/g).length===10;
  },

  isValidEmail: function (value) {
    return value.match(SPValidator.emailRegex);
  },

  isValidURL: function (value) {
    return value.match(SPValidator.urlRegex);
  },

  validateField: function(field, fieldValue) {
    if (field.type == Constants.FORM_FIELD_HIDDEN || field.type == Constants.FORM_FIELD_GROUP) {
        return null;
    }
    var error = null;
    if (field.required && ((!fieldValue && fieldValue !== 0) || (fieldValue instanceof Array && fieldValue.length == 0))) {
      if (field.type == Constants.FORM_FIELD_CHECKBOX) {
        error = 'error_checkbox_required';
      } else if (field.type == Constants.FORM_FIELD_RADIO) {
        error = 'error_radio_required';
      } else if (field.type == Constants.FORM_FIELD_SELECT) {
        error = 'error_select_required';
      } else if (field.type == Constants.FORM_FIELD_FILE) {
        error = 'error_file_required';
      } else {
        error = 'error_required';
      }
    } else if (fieldValue == undefined || fieldValue == null || ((typeof fieldValue) == 'string' && fieldValue.trim() == '')) {
        return null;
    } else if (field.customValidator) {
      error = field.customValidator(field, fieldValue);
    } else if (field.propValidator) {
      if (!field.propValidator(fieldValue)) error = "error_invalid_value";
    } else if (field.dataType == Constants.DATA_TYPE_EMAIL) {
        if (SPValidator.isValidEmail(fieldValue)) {
          return null;
        } else {
          error = 'error_invalid_email';
        }
    } else if (field.dataType == Constants.DATA_TYPE_URL) {
      if (SPValidator.isValidURL(fieldValue)) {
        return null;
      } else {
        error = 'error_invalid_url';
      }
    } else if (field.dataType == Constants.DATA_TYPE_US_PHONE) {
      if (SPValidator.isValidUSPhone(fieldValue)) {
        return null;
      } else {
        error = 'error_invalid_phone_number';
      }
    
    } else if (field.dataType == Constants.DATA_TYPE_OBJECT) {
      try {
        JSON.parse(fieldValue);
        return null;
      } catch (e) {
        error = 'error_invalid_json';
      }
    } else if (field.dataType == Constants.DATA_TYPE_ARRAY) {
      try {
        let aval = JSON.parse(fieldValue);
        if (!Array.isArray(aval)) {
          error = 'error_invalid_array';
        } else {
          return null;
        }
      } catch (e) {
        error = 'error_invalid_array';
      }
    
    } else if (field.pattern && !field.pattern.test(fieldValue)) {
        error = 'error_invalid_value';
    } else if (field.dataType == Constants.DATA_TYPE_INT) {
      if (Array.isArray(fieldValue)) {
        for (let ii=0; ii<fielValue.length; ii++) {
          if (fieldValue[ii] != parseInt(fieldValue, 10)) {
            error = 'error_must_be_int';
            break;
          }
        }
      } else if (fieldValue != parseInt(fieldValue, 10)) {
        error = 'error_must_be_int';
      }
    } else if (field.dataType == Constants.DATA_TYPE_FLOAT) {
      if (Array.isArray(fieldValue)) {
        for (let ii=0; ii<fielValue.length; ii++) {
          if (fieldValue[ii] != parseFloat(fieldValue, 10)) {
            error = 'error_must_be_float';
            break;
          }
        }
      } else if (fieldValue != parseFloat(fieldValue, 10)) {
        error = 'error_must_be_float';
      }
    } else if (field.minValue && fieldValue < field.minValue) {
        error = 'error_value_cannot_be_less_than';
    } else if (field.maxValue && fieldValue > field.maxValue) {
        error = 'error_value_cannot_be_greater_than';
    } else if (field.minLength && fieldValue.length < field.minLength) {
        error = 'error_length_cannot_be_less_than';
    } else if (field.maxLength && fieldValue.length > field.maxLength) {
        error = 'error_length_cannot_be_greater_than';
    } 
    if (field.errorMsg && error) error = field.errorMsg;
    return error;
  },

  validateForm: function (formDef, dataObj, errors) {
    var numErrors = SPValidator.validateFields(formDef.fields, dataObj, errors);
    if (numErrors > 0) return numErrors;
    if (formDef.constraints) {
      var len = formDef.constraints.length;
      for (let ii=0; ii<len; i++) {
        var err = formDef.constraints[ii](formDef, dataObj);
        if (err != null) {
          for (let prop in err) {
            errors[prop] = err[prop];
            numErrors++;
          }
          return numErrors;
        }
      }
    }
    return numErrors;
  },
  validateFields: function (fields, dataObj, errors) {
    var len = fields.length;
    var numErrors = 0;
    for (let ii=0; ii<len; ii++) {
      if (fields[ii].type == Constants.FORM_FIELD_HIDDEN) continue;
      if (fields[ii].type == Constants.FORM_FIELD_GROUP) {
        numErrors = numErrors + this.validateFields(fields[ii].fields, dataObj, errors);

      } else {
         var error = SPValidator.validateField(fields[ii], dataObj[fields[ii].name]);
         errors[fields[ii].name] = error;
         if (error != null) {
           numErrors++;
         }
      }
    }
    return numErrors;
  
  }
};

module.exports = SPValidator;