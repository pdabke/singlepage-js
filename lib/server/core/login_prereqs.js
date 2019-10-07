/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
'use strict';

const ServiceGateway = require('./service_gateway');
const AppError = require('./app_error')
const LoginPrereqs = {
  tou_check: {
    isMet(userInfo) {
      if (userInfo.userData && userInfo.userData.touAccepted) return true;
      return false;
    },
    async handleResponse(params, clientInfo, userInfo, roles, res) {
      if (params.tou_accepted) {
        var userData = userInfo.userData;
        if (!userData) userData = {};
        userData.touAccepted = true;
        await ServiceGateway.getService('UserService').updateUserData({userData: userData}, clientInfo, userInfo, roles);
        return {};
      } else {
        return new AppError('error_must_accept_tou');
      }
    }
  }

}

module.exports = LoginPrereqs;