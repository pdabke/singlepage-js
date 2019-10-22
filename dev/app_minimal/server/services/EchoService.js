/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
"use strict";
var _SP = null;
var _COUNT = 1;

const EchoService = {
  init(config, SP) {
    _SP = SP;
    if (config.EchoService && config.EchoService.count) _COUNT = config.EchoService.count;
  },
  echo(params) {
    if (!params.words) return new _SP.AppError('error_must_type_words_to_echo');
    var resp = '';
    for (let ii=0; ii<_COUNT; ii++) {
      resp = resp + ' ' + params.words;
    }
    return resp;
  }
}
module.exports = EchoService;