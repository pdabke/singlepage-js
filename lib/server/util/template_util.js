/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
'use strict';
const Mustache = require('mustache');

const TemplateUtil = {
  evaluate(template, context) {
    return Mustache.render(template, context);
  }
};
module.exports = TemplateUtil;