/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
'use strict';

var AppError = function(errorMsg, errorDetail) {
  this.errorMsg = errorMsg;
  this.errorDetail = errorDetail;
}
module.exports = AppError;