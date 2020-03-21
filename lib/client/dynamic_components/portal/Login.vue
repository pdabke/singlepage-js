<!--
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 -->

<template>
  <div class="sp-full-viewport sp-center-content">
    <div class="pb-2">
      <img :src="logoUrl" class="sp-logo"/>
    </div>
    <div class="sp-login-card">
      <h4 class="card-title mb-4 text-center">{{$i18n('msg_login')}}</h4>
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
              @click.prevent.stop="$app.login(username, password, rememberMe, loginFail)"
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

  methods: {
    loginFail: function(status, errorMsg /*, result*/) {
      this.$app.modal.showErrorDialog(this.$i18n(errorMsg));
    }
  },

  data: function() {
    return { username: "", password: "", rememberMe: false,
      messages: {
        "en": {
          "msg_email_or_screen_name": "Email or Screen Name",
          "msg_password": "Password",
          "msg_remember_me": "Remember Me",
          "msg_forgot_password": "Forgot Password?",
          "msg_email": "Email",
          "msg_screen_name_optional": "Screen Name (Optional)",
          "msg_screen_name": "Screen Name",
          "msg_send_reset_code": "Send Code",
          "msg_reset_password_info": "Enter you email or screen name and click <em>Send Code</em>. We will send you the code to the email associated with your account.",
          "msg_have_reset_code": "I already have the code",
          "msg_reset_code": "Password Reset Code",
          "msg_reset_password": "Reset Password",
          "msg_password_reset_code": "Password Reset Code",
          "msg_password_reset_success": "Password reset successfully.",
          "msg_reg_code": "Registration Code",
          "msg_send_reg_code": "Send Registration Code",
          "msg_resend_code": "Resend Code",
          "msg_first_name": "First Name",
          "msg_last_name": "Last Name",
          "msg_confirm_password": "Confirm Password",
          "msg_registration_code": "Please enter the registration code sent to your email and a few additional items to complete your registration.",
          "msg_resent_code": "We have resent your code. Please check your SPAM folder if you don't see it in your inbox.",
          "msg_have_registration_code": "I already have a registration code",
          "error_invalid_code": "Invalid Code",
          "error_expired_code": "This code has expired.",
          "error_user_exists": "This email is already registered.",
          "error_account_not_found": "Sorry! We could not find a matching user account.",
          "error_invalid_email_or_screen_name": "Invalid email or screen name.",
          "error_enter_email_or_screen_name": "Please enter email or screen name",
          "error_enter_valid_email": "Please enter a valid email address.",
          "error_problem_with_login": "Sorry! There was a problem logging you in.",
          "error_invalid_username_or_password": "Invalid user name or password.",
          "error_missing_username_or_password": "Missing user name or password.",
          "error_too_many_login_attempts": "Your account has been locked due to too many failed login attempts. Please reset your password to continue.",
          "error_already_logged_in": "You are already logged in.",
          "error_email_or_screen_name_is_required": "You must provide your screen name or email."

        }
      }
    };
  }
};
</script>