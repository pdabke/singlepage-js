/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
'use strict';
const Constants = require('../../common/constants');
var Config = {
  SITE_TITLE: 'SinglePage.js',
  SITE_DESCR: 'Web site built using SinglePage.js',
  SITE_KEYWORDS: 'SinglePage.js, Vue.js',
  SITE_AUTHOR: 'Padmanabh Dabke',
  /* You can either specify an absolute URL or a URI relative to CDN_URL */
  EMAIL_LOGO_URL: '/images/app_logo.png',
  PERISHABLE_CACHE_MAX_SIZE: 500,
  TRANSIENT_CACHE_MAX_SIZE: 500,
  PERISHABLE_CACHE_MAX_AGE: 300000,
  AVATAR_SIZE: 48,
  AVATAR_URL_PREFIX: '/files/avatar/',
  PUBLIC_FILES_URL_PREFIX: '/files/public/',
  PRIVATE_FILES_URL_PREFIX: '/files/private/',
  REMEMBER_ME_SESSION_TIMEOUT: 2592000, // In Seconds
  SESSION_TIMEOUT: 3600, // In Seconds
  LAST_ACCESS_REFRESH_INTERVAL: 60, // User's last access will be updated only after this number in seconds
  SESSION_COOKIE_NAME: 'sksession',
  MAX_FAILED_LOGIN_ATTEMPTS: 5,
  GOOGLE: {
    verifyURL: 'https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=',
    userInfoURL: 'https://www.googleapis.com/oauth2/v2/userinfo?access_token='
  },

  FACEBOOK: {
    userInfoURL: 'https://graph.facebook.com/me?fields=email,first_name,last_name,gender&access_token='
  },

  /* Tags allowed for form fields of type HTML */
  HTML_TAGS_ALLOWED: [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
  'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
  'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'iframe' ],
  
  /* Configurable Forms */
  FORM_USER_PROFILE: {

    fields: [
      { name: 'screen_name', label: 'msg_screen_name', type: 'text', maxLength: 20 },
      { name: 'first_name', label: 'msg_first_name', type: 'text', maxLength: 20, required: true },
      { name: 'last_name', label: 'msg_last_name', type: 'text', maxLength: 20, required: true },
      // FORM_FIELD_HIDDEN: 'hidden',
      { name: 'hidden_int', label: 'Hidden Int', type: Constants.FORM_FIELD_HIDDEN, value:"2", dataType: Constants.DATA_TYPE_INT },
      // FORM_FIELD_TEXTAREA: 'textarea',
      { name: 'textarea', label: 'Text Area', type: Constants.FORM_FIELD_TEXTAREA, required: true },
      // FORM_FIELD_HTML: 'html',
      { name: 'html', label: 'HTML', type: Constants.FORM_FIELD_HTML, required: true },
      // FORM_FIELD_SELECT: 'select',
      { name: 'select_single', label: 'Select', type: Constants.FORM_FIELD_SELECT, required: true,
      options: [{label: 'Tiger', value: '0'}, {label: 'Lion', value: '1'},{label: 'Monkey', value: '2'}] },
      // FORM_FIELD_SELECT: multiple,
      { name: 'select_multiple', label: 'Multi Select', type: Constants.FORM_FIELD_SELECT, required: true, multiple: true,
      options: [{label: 'Tiger', value: '0'}, {label: 'Lion', value: '1'},{label: 'Monkey', value: '2'}]},
      // FORM_FIELD_CHECKBOX: 'checkbox',
      { name: 'checkbox_single', label: 'Check animals you like', type: Constants.FORM_FIELD_CHECKBOX, required: true,
        options: [{label: 'I Agree', value: '0'}]},
      // FORM_FIELD_CHECKBOX: 'checkbox' Group
      { name: 'checkbox_group', label: 'Check animals you like', type: Constants.FORM_FIELD_CHECKBOX, required: true,
        options: [{label: 'Tiger', value: '0'}, {label: 'Lion', value: '1'},{label: 'Monkey', value: '2'}]},
      // FORM_FIELD_RADIO: 'radio',
      { name: 'radio', label: 'Radio', type: Constants.FORM_FIELD_RADIO, required: true, 
        options: [{label: 'Tiger', value: '0'}, {label: 'Lion', value: '1'},{label: 'Monkey', value: '2'}] }
      
    ]
  }
}
module.exports = Config;