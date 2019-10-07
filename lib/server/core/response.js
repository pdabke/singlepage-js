/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
'use strict'
var MimeTypes = require('mime-types')
var Constants = require('../../common/constants');
var _CORS_ORIGIN = null;
var _JSON_RESPONSE_HEADER = null;
var SPResponse = {
  init(config) {
    _CORS_ORIGIN = config.CORS_ORIGIN;
    _JSON_RESPONSE_HEADER = _CORS_ORIGIN ? {
      "Content-Type": 'application/json',
      "Access-Control-Allow-Origin": _CORS_ORIGIN,
      "Access-Control-Allow-Credentials": 'true'
    } : {
        "Content-Type": 'application/json',
        "Access-Control-Allow-Credentials": 'true'
      }
  },

  success(res, result, headers) {
    let resp = {};
    if (!headers) headers = _JSON_RESPONSE_HEADER;
    resp.status = Constants.RETURN_SUCCESS;
    resp.result = result;
    res.writeHead(200, headers);
    res.end(dehydrate(resp));
  },

  loginRequired(res) {
    let resp = {};
    resp.status = Constants.RETURN_LOGIN_REQUIRED;
    res.writeHead(200, _JSON_RESPONSE_HEADER);
    res.end(JSON.stringify(resp));
  },

  accessDenied(res) {
    let resp = {};
    resp.status = Constants.RETURN_ACCESS_DENIED;
    res.writeHead(200, _JSON_RESPONSE_HEADER);
    res.end(JSON.stringify(resp));
  },

  internalError(res, err) {
    let resp = {};
    resp.status = Constants.RETURN_INTERNAL_ERROR;
    res.writeHead(200, _JSON_RESPONSE_HEADER);
    res.end(JSON.stringify(resp));
    if (err) console.log(err);
  },

  appError(res, errorMessage, errorInfo, headers) {
    let resp = {};
    if (!headers) headers = _JSON_RESPONSE_HEADER;
    resp.status = Constants.RETURN_APP_ERROR;
    resp.error = errorMessage;
    resp.result = errorInfo;
    res.writeHead(200, headers);
    res.end(JSON.stringify(resp));
  },

  options(res) {
    if (_CORS_ORIGIN) {
      res.writeHead(200, {
        "Content-Type": 'text/plain',
        "Access-Control-Allow-Origin": _CORS_ORIGIN,
        "Access-Control-Allow-Credentials": 'true',
        "Access-Control-Allow-Headers": 'Content-Type,SP-Site-URL,SP-File-Upload'
      });

    } else {
      res.writeHead(200, {
        "Content-Type": 'text/plain',
        /* "Access-Control-Allow-Origin": _CORS_ORIGIN, */
        "Access-Control-Allow-Credentials": 'true',
        "Access-Control-Allow-Headers": 'Content-Type,SP-Site-URL,SP-File-Upload'
      });
    }

    res.write('');
    res.end();
  },

  invalidRequest(res, errMsg) {
    let resp = {};
    resp.status = Constants.RETURN_INVALID_REQUEST;
    resp.error = errMsg;
    res.writeHead(400, _JSON_RESPONSE_HEADER);
    return res.end(JSON.stringify(resp));
  },

  notFound(response) {
    response.writeHead(404, { "Content-Type": "text/plain" });
    response.write("404 Not Found\n");
    response.end();
  },

  staticInternalError(response) {
    response.writeHead(500, { "Content-Type": "text/plain" });
    response.write("Sorry! Something went wrong, please try your request later.\n");
    response.end();
  },

  sendFile(response, message, fileName, headers) {
    if (!headers) headers = {};
    headers["Content-Type"] = getContentType(fileName);
    response.writeHead(200, headers);
    response.write(message);
    response.end();
  },

  getHeaders(sessionCookie) {
    var resp = _CORS_ORIGIN ?
      {
        'Set-Cookie': sessionCookie,
        "Content-Type": 'application/json',
        "Access-Control-Allow-Credentials": 'true',
        "Access-Control-Allow-Origin": _CORS_ORIGIN
      } :
      {
        'Set-Cookie': sessionCookie,
        "Content-Type": 'application/json',
        "Access-Control-Allow-Credentials": 'true'
        /* "Access-Control-Allow-Origin": _CORS_ORIGIN */
      };
    return resp;

  },

  getUnloggedHeaders() {
    return _JSON_RESPONSE_HEADER;
  }

}


function dehydrate(obj) {
  if (!obj) return '';
  Object.keys(obj).forEach(function (key, index) {
    if (obj[key] == null) obj[key] = undefined;
  });
  return JSON.stringify(obj);
}

function getContentType(fileName) {
  if (!fileName) return 'application/octet-stream'
  if (fileName.endsWith('.vue')) return MimeTypes.lookup('txt')
  let mt = MimeTypes.lookup(fileName)
  if (mt) return mt;
  return 'application/octet-stream'
}

module.exports = SPResponse;