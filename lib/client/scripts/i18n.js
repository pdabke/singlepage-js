/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
"use strict";
var SPI18N = {
  locale: 'en-US',
  appMessages: {},
  getMessage(key, messages) {
    if (!key) return '';
    if (messages && messages[key]) return messages[key];
    if (SPI18N.appMessages[key]) return SPI18N.appMessages[key];
    return key;
  },

  localize(key, messages, values) {
    let msg = SPI18N.getMessage(key, messages);
    return SPI18N.evaluate(msg, values);
  },

  evaluate(msg, values) {
    if (!values) return msg;
    var newMsg = msg;
    Object.keys(values).forEach(function(key) {
      let rx = new RegExp("\\{\\s*" + key + "\\s*\\}", "g");
      newMsg = newMsg.replace(rx, values[key]);
    })
    return newMsg;
    //var formatter = new IntlMessageFormat(msg, SPI18N.locale);
    //return formatter.format(values);
  },

  computeErrorArg: function (key, field) {
    if (key == 'error_value_cannot_be_less_than') {
      return field.minValue;
    } else if (key == 'error_value_cannot_be_greater_than') {
      return field.maxValue;
    } else if (key == 'error_length_cannot_be_less_than') {
      return field.minLength;
    } else if (key == 'error_length_cannot_be_greater_than') {
      return field.maxLength;
    }
  }
}

export default SPI18N;