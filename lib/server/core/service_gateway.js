/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
'use strict';
const Response = require('./response');
const AppError = require('./app_error');

var Services = {};
var InternalServices = {};

var ServiceGateway = {
  setServices(s) {
    Services = s[0];
    InternalServices = s[1];
  },

  getService(name) {
    return Services[name];
  },

  getInternalService(name) {
    return InternalServices[name];
  },

  async handleServiceRequest(req, res, data) { 
    if (!data) {
      console.error('Service call without any call data.');
      Response.internalError(res, 'Service call without any call data.');
      return;
    }

    let serviceName = data.service;

    if (!serviceName || serviceName == 'init') {
      console.error('Service call without service name: ' + JSON.stringify(data));
      Response.internalError(res, 'Service call without service name.');
      return;
    }

    if (!Services[serviceName]) {
      console.error('Service call with invalid service name: ' + JSON.stringify(data));
      Response.internalError(res, 'Service call with non-existent service name: ' + serviceName);
      return;
    }

    if (serviceName == 'SessionService') {
      // SessionService is handled in this block since it is responsible for user session
      // handling and it returns its own response
      try {
        // getSessionInfo should only be called internally, never from outside
        if (data.method == 'getSessionInfo') return;
        await Services.SessionService[data.method](req, res, data);
        return;
      } catch (e) {
        console.error(e);
        Response.internalError(res);
        return;
      }
    }


    let service = Services[serviceName];

    if (!data.method) {
      console.error('Service call without method name: ' + JSON.stringify(data));
      Response.invalidRequest(res, 'Service call without method name.');
      return;
    }

    if (service[data.method]) {
      var user = null;
      try {
        var sessionInfo = await Services.SessionService.getSessionInfo(req, data.params);
        var user = sessionInfo.userInfo;
        var clientInfo = sessionInfo.clientInfo;
        var roles = sessionInfo.roles;
        if (!checkAccess(service, data.method, user, roles, res)) return;

        // console.debug('Calling ' + serviceName + '.' + data.method);
        var result = await service[data.method](data.params, clientInfo, user, roles);
        //console.log('Done with service method.');
        if (result instanceof AppError) Response.appError(res, result.errorMsg, result.errorDetail, sessionInfo.headers);
        else {
          if (!result) result = {};
          Response.success(res, result, sessionInfo.headers);
        }
        return;
      } catch (e) {
        console.error(e);
        Response.internalError(res);
        return;
      }
    } else {
      console.error('Service call with invalid method name: ' + JSON.stringify(data));
      Response.internalError(res);
      return;
    }
  }

}

module.exports = ServiceGateway;

function checkAccess(service, method, user, roles, res) {
  if (!service.ACL) return true;
  if (roles.includes('SUPERADMIN') || roles.includes('ADMIN')) return true;
  if (service.ACL['*']) {
    let result = checkAccessHelper(service.ACL['*'], user, roles, res);
    if (!result) return false;
  }
  if (service.ACL[method]) {
    return checkAccessHelper(service.ACL[method], user, roles, res);
  } else {
    return true;
  }
}

function checkAccessHelper(roles, user, rolesRequired, res) {
  if (!user) { Response.loginRequired(res); return false; }
  let access = true;
  if (rolesRequired.length != 0) {
    access = false;
    let len = roles.length;
    for (let i = 0; i < len; i++) {
      for (let j = 0; j < rolesRequired.length; j++) {
        if (roles[i] == rolesRequired[j]) { access = true; break; }
      }
      if (access) break;
    }
  }
  if (!access) {
    Response.accessDenied(res);
  }
  return access;
}

