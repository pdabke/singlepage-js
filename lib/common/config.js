/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
'use strict';

var SPConfig = {
  LOCALE: 'en-US',
  CDN_URL: '/sp-files',
  SERVICE_URL: null,
  IS_MULTI_SITE: false,
  IS_MULTI_USER: false,
  IS_SELF_REGISTRATION_ALLOWED: false,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/,
  LOGIN_PREREQS: ['tou_check']
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = SPConfig;
}