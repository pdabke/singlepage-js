<!--
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 -->

<template>
  <div>
    <div class="d-flex justify-content-center p-4">
      <img :src="logoUrl" class="sp-logo"/>
    </div>
    <div class="card bg-light sp-login">
      <h4 class="card-title mb-5 text-center">{{$i18n('msg_login')}}</h4>
      <div id="form-login-1">
        <form name="form-login" method="POST">
          <div class="form-group">
            <input
              class="form-control"
              type="text"
              id="username"
              name="j_username"
              v-model="username"
              :placeholder="$i18n('msg_email_or_screen_name')"
            />
          </div>
          <div class="form-group">
            <input
              class="form-control"
              type="password"
              id="password"
              name="j_password"
              v-model="password"
              :placeholder="$i18n('msg_password')"
            />
          </div>
          <div class="pb-2">
            <div class="custom-control custom-checkbox">
              <input
                id="remember-me-checkbox"
                type="checkbox"
                class="custom-control-input"
                v-model="rememberMe"
              />
              <label
                id="remember-me"
                class="custom-control-label"
                for="remember-me-checkbox"
              >{{$i18n('msg_remember_me')}}</label>
            </div>
          </div>
          <div class="mt-2 mb-2">
            <button
              id="login-button"
              class="btn btn-primary btn-block"
              @click.prevent.stop="$app.login(username, password, rememberMe)"
            >{{$i18n('msg_login')}}</button>
          </div>
          <!--
          <div style="font-size: smaller;text-align: center;">
            <a
              href="#"
              onclick="return skipToResetStep1(event)"
              id="forgot-password-link"
            >{{$i18n('msg_forgot_password')}}</a>
          </div>
          -->
        </form>
      </div>
    </div>
  </div>
</template>
<script>
"use strict";
export default {
  props: ['loginLogoUrl'],
  computed: {
    logoUrl: function() {
      if (this.loginLogoUrl) return this.loginLogoUrl;
      else return this.$app.config.CDN_URL + '/images/app_logo.png';
    }
  },

  data: function() {
    return { username: "", password: "", rememberMe: false };
  }
};
</script>