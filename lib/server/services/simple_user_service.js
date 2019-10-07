/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
'use strict';

const UserService = {

  /* Note that we return roles for a give site via role property on the user_info object
  * That's correct since this is being returned to a specific host. This method is also called
  * to get user info by http_server. We maintain the roles a bit differently on the server side
  * since the user can potentially go to multiple sites with the same auth token.
  */
  async getUserInfo(params, clientInfo, userInfo, roles) {
    if (!userInfo) return null;
    var newU = {};
    newU.firstName = userInfo.firstName;
    newU.lastName = userInfo.lastName;
    newU.screenName = userInfo.screenName;
    newU.displayName = userInfo.displayName;
    newU.email = userInfo.email;
    newU.avatarURL = userInfo.avatar;
    newU.roles = roles;
    return newU;
  },

  getProfileInfo(params, clientInfo, userInfo, roles) {
    var response = {};

    return response;
  },

  async updateProfile(params, clientInfo, userInfo, roles) {
    return null;
  },

  async handleLoginPrereqsResponse(params, clientInfo, userInfo, roles) {
  },

  async updateUserData(params, clientInfo, userInfo, roles) {
    // Not implemented
  }

}

module.exports = UserService;