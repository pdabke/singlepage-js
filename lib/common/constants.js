/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
'use strict';
var SPConstants = {
  RETURN_SUCCESS: 0,
  RETURN_LOGIN_REQUIRED: -1,
  RETURN_APP_ERROR: -2,
  RETURN_ACCESS_DENIED: -3,
  RETURN_INTERNAL_ERROR: -4,
  RETURN_NO_CONNECTION: -5,
  RETURN_INVALID_REQUEST: -6,

  SINGLE_SITE_ACCESS_TYPES: [
    {label: 'msg_protected', value: 'PROTECTED'},
    {label: 'msg_public', value: 'PUBLIC'},
  ],
  MULTI_SITE_ACCESS_TYPES: [
    {label: 'msg_private', value: 'PRIVATE'},
    {label: 'msg_protected', value: 'PROTECTED'},
    {label: 'msg_public', value: 'PUBLIC'},
  ],
  FILE_ACCESS_TYPE_PUBLIC: 'PUBLIC',
  FILE_ACCESS_TYPE_PRIVATE: 'PRIVATE',
  FILE_ACCESS_TYPE_AVATAR: 'AVATAR',
  
  ROLE_SUPERADMIN: 'SUPERADMIN', 
  ROLE_ADMIN: 'ADMIN', 
  ROLE_MODERATOR: 'MODERATOR', 
  ROLE_REVIEWER: 'REVIEWER', 
  ROLE_MEMBER: 'MEMBER', 
  ROLE_GUEST: 'GUEST', 
  ROLE_PLATINUM: 'PLATINUM', 
  ROLE_GOLD: 'GOLD', 
  ROLE_SILVER: 'SILVER', 
  ROLE_BRONZE: 'BRONZE',

  ROLES: [
    {label: 'msg_role_superadmin', value:'SUPERADMIN'}, 
    {label: 'msg_role_admin', value:'ADMIN'}, 
    {label: 'msg_role_moderator', value:'MODERATOR'}, 
    {label: 'msg_role_reviewer', value:'REVIEWER'}, 
    {label: 'msg_role_member', value:'MEMBER'}, 
    {label: 'msg_role_guest', value:'GUEST'}, 
    {label: 'msg_role_platinum', value:'PLATINUM'}, 
    {label: 'msg_role_gold', value:'GOLD'}, 
    {label: 'msg_role_silver', value:'SILVER'}, 
    {label: 'msg_role_bronze', value:'BRONZE'}, 

  ],

  FORM_FIELD_HIDDEN: 'hidden',
  FORM_FIELD_TEXTAREA: 'textarea',
  FORM_FIELD_HTML: 'html',
  FORM_FIELD_TEXT: 'text',
  FORM_FIELD_PASSWORD: 'password',
  FORM_FIELD_SELECT: 'select',
  FORM_FIELD_CHECKBOX: 'checkbox',
  FORM_FIELD_RADIO: 'radio',
  FORM_FIELD_DATE: 'date', 
  FORM_FIELD_TIMESTAMP: 'timestamp',
  FORM_FIELD_FILE: 'file',
  FORM_FIELD_GROUP: 'group',
  
  DATA_TYPE_INT: 'int',
  DATA_TYPE_FLOAT: 'float',
  DATA_TYPE_EMAIL: 'email',
  DATA_TYPE_URL: 'url',
  DATA_TYPE_US_PHONE: 'us-phone',
  DATA_TYPE_OBJECT: 'object',
  DATA_TYPE_ARRAY: 'array',

  CODE_REGISTRATION: 0,
  CODE_PASSWORD_RESET: 1
};

module.exports = SPConstants;
