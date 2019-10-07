/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
'use strict';
const process = require('process');
const Response = require('../core/response');
const Util = require('../util/util');

const _USER_INFO = {"firstName": "SinglePage", "lastName": "Admin", "screenName": "admin", "displayName": "SP Admin"};

var _USER_NAME = "admin";
var _PASSWORD = "admin";
var _CONFIG = null;
var _IS_HTTPS = null;
const SessionService = {
  async init(config) {
    _CONFIG = config;
    _IS_HTTPS = config.IS_HTTPS;
    if (process.env.SP_USER_NAME) _USER_NAME = process.env.SP_USER_NAME.toLowerCase();
    if (process.env.SP_PASSWORD) _PASSWORD = process.env.SP_PASSWORD;
  },

  async getSessionInfo(req, params) {
    var sessionInfo = {};

    // Check if we have a valid session cookie, if so we use hardcoded admin user as the current user
    var userInfo = null;
    if (req.headers.cookie) {
      var match = req.headers.cookie.match(new RegExp('(^| )' + _CONFIG.SESSION_COOKIE_NAME + '=([^;]+)'));
      if (match) {
        try {
          let encrypted = match[2];
          let decrypted = Util.decrypt(encrypted);
          let tokens = decrypted.split('.');
          let lastAccess = parseInt(tokens[0]);
          let now = Math.round(new Date().getTime() / 1000);
          var age = tokens[1] == '1' ? _CONFIG.REMEMBER_ME_SESSION_TIMEOUT : _CONFIG.SESSION_TIMEOUT;
          if ((now - lastAccess) <= age) {
            userInfo = _USER_INFO;
            if (now - lastAccess > _CONFIG.LAST_ACCESS_REFRESH_INTERVAL) {
              let sessionCookie = constructSessionCookie(req, userInfo.id, 1, parseInt(tokens[1]));
              sessionInfo.headers = Response.getHeaders(sessionCookie);
            }
      
          }
        } catch (e) {
          console.log('Received invalid session cookie.');
          console.log(e);
    
        }
      }
    }
    sessionInfo.clientInfo = constructClientInfo(req);
    sessionInfo.userInfo = userInfo;
    sessionInfo.roles = userInfo ? ['SUPERADMIN'] : ['GUEST'];
    return sessionInfo;
  },

  async login(req, res, data) {
    if (!data.params || ! data.params.username || ! data.params.password) {
      Response.appError(res, 'error_missing_username_or_password');
      return;
    }

    if (! (data.params.username.toLowerCase() == _USER_NAME && data.params.password == _PASSWORD)) {
      Response.appError(res, 'error_invalid_username_or_password');
      return;
    }

    var sessionCookie = constructSessionCookie(req, 0, 1, data.params.remember_me);
    return Response.success(res, {}, Response.getHeaders(sessionCookie));
  },

  async logout(req, res, data) {
    let sessionCookie = constructLogoutCookie(req, res, data);
    Response.success(res, {}, Response.getHeaders(sessionCookie));
  },

  async changePassword(req, res, data) {
    Response.appError(res, 'error_unsupported_operation');
  }
};

function constructSessionCookie(req, userId, credVersion, rememberMe) {
  var now = Math.round(new Date().getTime() / 1000);
  var cookieValue = _CONFIG.SESSION_COOKIE_NAME + '=' + Util.encrypt('' + now + '.' + (rememberMe ? '1' : '0') + '.' + userId
    + '.' + credVersion);
  cookieValue = cookieValue + "; Path=/; HttpOnly";
  if (isSecureRequest(req)) cookieValue = cookieValue + "; Secure";
  if (rememberMe) {
    var expires = new Date().getTime() + _CONFIG.REMEMBER_ME_SESSION_TIMEOUT*1000;
    cookieValue = cookieValue + "; Expires=" + new Date(expires).toUTCString()
  }
  return cookieValue;
}

function constructLogoutCookie(req, userId) {
  var cookieValue = _CONFIG.SESSION_COOKIE_NAME + '=' + Util.encrypt('0.0.' + userId + '.0') + '; Path=/; HttpOnly';
  if (isSecureRequest(req)) cookieValue = cookieValue + "; Secure";
  cookieValue = cookieValue + "; Expires=" + new Date(0).toUTCString()
  return cookieValue;
}

function constructClientInfo(req) {
  var siteURL = req.headers['sp-site-url'];
  if (!siteURL) throw new Error('Missing site URL information.');

  var cinfo = {};
  siteURL = Util.stripLastSlash(siteURL);
  cinfo.siteURL = siteURL;
  cinfo.tenantId = 0;
  cinfo.siteId = 0;
  return cinfo;
}

function isSecureRequest(req) {
  if (_IS_HTTPS) return true;
  if (req.connection.encrypted) {
    _IS_HTTPS = true;
    return true;
  }
  // Heroku passes a request header: req.headers['x-forwarded-proto'] === 'https'
  if (req.headers['x-forwarded-proto'] === 'https') {
    // Cache flag for efficiency
    _IS_HTTPS = true;
    return true;
  }

  /* The following won't work for IE/Edge since it does not seem to pass the origin header */
  if (req.headers.origin && req.headers.origin.startsWith('https')) {
    _IS_HTTPS = true;
    return true;
  }
  return false;
}

// Based on express.js code: https://github.com/expressjs/express/blob/master/lib/request.js
// Keeping it here so that we can use it when we introduce client IP detection in case where
// the server is deployed behind a proxy
/*
function protocol(req) {
  var proto = req.connection.encrypted
    ? 'https'
    : 'http';
  var trust = this.app.get('trust proxy fn');

  if (!trust(req.connection.remoteAddress, 0)) {
    return proto;
  }

  // Note: X-Forwarded-Proto is normally only ever a
  //       single value, but this is to be safe.
  var header = req.headers['x-forwarded-proto'] || proto
  var index = header.indexOf(',')

  return index !== -1
    ? header.substring(0, index).trim()
    : header.trim()
};
*/
module.exports = SessionService;