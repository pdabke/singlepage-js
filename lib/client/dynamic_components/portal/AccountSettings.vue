<!--
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 -->
<template>
	<div class="sp-one-column-container mt-3">
    <div class="row">
      <div class="col">
        <div class="border-light card">
          <div class="card-body">
            <h4 class="mb-4">{{$i18n('msg_account_settings')}}</h4> 
            <div class="alert alert-danger">Account settings functionality is under construction.</div>
            <nav>
              <div class="nav nav-tabs" id="nav-tab" role="tablist">
                <a class="nav-item nav-link active" id="nav-update-profile-tab" data-toggle="tab" href="#nav-update-profile" 
                role="tab" aria-controls="nav-update-profile" aria-selected="true">{{$i18n('msg_update_profile')}}</a>
                <a class="nav-item nav-link" id="nav-change-password-tab" data-toggle="tab" href="#nav-change-password"
                role="tab" aria-controls="nav-change-password" aria-selected="false">{{$i18n('msg_change_password')}}</a>
                <a class="nav-item nav-link" id="nav-upload-avatar-tab" data-toggle="tab" href="#nav-upload-avatar"
                role="tab" aria-controls="nav-upload-avatar" aria-selected="false">{{$i18n('msg_upload_avatar')}}</a>
              </div>
            </nav>
            <div class="tab-content" id="nav-tabContent">
              <div class="tab-pane fade show active" id="nav-update-profile" role="tabpanel" aria-labelledby="nav-update-profile-tab">
                <div class="card-body">
                  <sp-loader :loaded="loaded" service="UserService" method="getProfileInfo" params="{}" 
                    :success-cb="updateProfileInfo"></sp-loader>
                  <sp-form v-if="loaded" :form-def="profileForm" :data-object="profileData" :errors="profileErrors" 
                      save-label="msg_update" saver-service="UserService" :save-callback="profileSuccess"
                      saver-method="updateProfile" success-message="msg_profile_updated_successfully">
                  </sp-form>
                </div>
              </div>
              <div class="tab-pane fade" id="nav-change-password" role="tabpanel" aria-labelledby="nav-change-password-tab">
                <div class="card-body">
                  <sp-form :form-def="passwordForm" :data-object="passwordInfo" :errors="passwordErrors" 
                      save-label="msg_change_password" saver-service="SessionService" :save-callback="pwSuccess"
                      saver-method="changePassword" success-message="msg_password_changed_successfully"></sp-form>
                </div>
              </div>
              <div class="tab-pane fade" id="nav-upload-avatar" role="tabpanel" aria-labelledby="nav-upload-avatar-tab">
                <div class="mt-3">
                  <div class="mb-4 mt-4 text-info text-center">{{$i18n('msg_upload_avatar_instructions')}}</div>
                  <form class="form-inline justify-content-center mb-4">
                      <span class="form-control sp-file-form-control mr-2"><input accept="image/*, gif, jpg, jpeg, png" @change="processAvatarFile" type="file"></span>
                     <button type="submit" @click.prevent="uploadAvatar" class="btn btn-primary">{{$i18n('msg_upload_avatar')}}</button>
                  </form>                 
                  <div class="mb-2 pt-4 pb-4 bg-light text-center">
                    <span class="img-thumbnail d-inline-block mr-3"><img :src="$app.user.avatarURL" class="sp-avatar-md"></span>
                    <span class="img-thumbnail d-inline-block"><img :src="$app.user.avatarURL" class="sp-avatar-sm"></span>
                  </div>
               </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
	</div>
</template>
<script>
"use strict";
export default {
  mounted: function() {
    this.loaded = false;
  },

  data: function() {
    return {
      loaded: false,
      passwordInfo: { old_password: "", new_password: "", new_password2: "" },
      passwordErrors: {},
      passwordForm: {
        fields: [
          {
            name: "old_password",
            label: "msg_old_password",
            required: true,
            maxLength: 30,
            type: "password",
            placeholder: "msg_old_password"
          },
          {
            name: "new_password",
            label: "msg_new_password",
            required: true,
            maxLength: 30,
            type: "password",
            placeholder: "msg_new_password",
            pattern: this.$app.config.PASSWORD_REGEX,
            errorMsg: "msg_password_requirements"
          },
          {
            name: "new_password2",
            label: "msg_retype_new_password",
            required: true,
            maxLength: 30,
            type: "password",
            placeholder: "msg_retype_new_password"
          }
        ],
        constraints: [
          function(fDef, dObj) {
            if (dObj[fDef.fields[1].name] == dObj[fDef.fields[2].name])
              return null;
            else
              return {
                new_password: "error_new_passwords_must_match",
                new_password2: "error_new_passwords_must_match"
              };
          },
          function(fDef, dObj) {
            if (dObj[fDef.fields[1].name] != dObj[fDef.fields[0].name])
              return null;
            else
              return {
                new_password:
                  "error_new_passwords_cannot_be_same_as_old_password"
              };
          }
        ]
      },
      profileForm: {},
      profileErrors: {},
      profileData: {},
      avatarFile: []
    };
  },

  methods: {
    pwSuccess: function(/*respObj*/) {
      this.$app.modal.showDialog("Success", "Password changed successfully.");
      this.passwordInfo.old_password = "";
      this.passwordInfo.new_password = "";
      this.passwordInfo.new_password2 = "";
    },

    updateProfileInfo: function(respObj) {
      this.profileData = respObj.profileData;
      this.profileForm = respObj.profileForm;
      this.loaded = true;
    },

    profileSuccess: function(respObj) {
      this.$app.user = respObj;
      this.$root.userInfo = respObj;
    },

    processAvatarFile: function(event) {
      this.avatarFile = event.target.files;
    },

    uploadAvatar: function() {
      if (!this.avatarFile || this.avatarFile.length == 0) {
        this.$root.modal.showErrorDialog("error_please_select_file");
      } else {
        this.$root.rpc.uploadFiles(
          this.avatarFile,
          this.$app.constants.FILE_ACCESS_TYPE_AVATAR,
          this.avatarSuccess.bind(this),
          this.avatarFailure.bind(this)
        );
      }
    },

    avatarSuccess: function(resp) {
      this.$app.userInfo.avatarURL = resp;
      this.$app.modal.showDialog(
        "msg_success",
        "msg_avatar_upload_successful"
      );
    },

    avatarFailure: function(errCode, errMessage) {
      this.$root.modal.showErrorDialog(errMessage);
    }
  }
};
</script>