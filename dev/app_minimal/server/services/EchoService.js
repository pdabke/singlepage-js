/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
"use strict";
const SP = require('../../lib/spserver');
const EchoService = {

  echo(params) {
    if (!params.words) return new SP.AppError('You must type the words to echo');
    var count = 1;
    if (params.count) count = params.count;
    var resp = '';
    for (let ii=0; ii<count; ii++) {
      resp = resp + ' ' + params.words;
    }
    return resp;
  }
}
module.exports = EchoService;