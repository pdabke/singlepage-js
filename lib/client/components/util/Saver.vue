<!--
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 -->

<template>
  <div>
    <!-- It's important to use click.stop to keep the event from bubbling up, otherwise it causes
    problems in updating the DOM on Edge like the autofill dropdown showing up after form submission.
    -->
    <button class="btn btn-primary" v-bind:disabled="saving" v-on:click.stop.prevent="saveData">{{$i18n(saveLabel)}}</button>
    <button v-if="cancelCallback" class="btn btn-secondary" v-on:click.stop.prevent="cancelUpdate">{{$i18n('msg_cancel')}}</button>
  </div>
</template>
<script>
'use strict';
export default {
  props: ['formDef', 'dataObject', 'methodParamObject', 'saveLabel', 'service', 'messages',
  'method', 'successMessage', 'titleProp', 'summaryProp', 'cancelCallback', 'saveCallback', 'actionKey', 'componentId'],
  data: function() {
    return {
      saving: false
    };
  },
  methods: {
    saveData: function() {
      this.saving = true;
      var errors = {};
      if (this.formDef && this.$app.validator.validateForm(this.formDef, this.dataObject, errors) > 0) {
        this.saving = false;
        this.$emit("validation-error", errors);
        return;
      }
      if (this.service) {
        this.$app.rpc.invoke(
          this.service,
          this.method,
          this.methodParamObject,
          this.updateSuccess,
          this.updateFail
        );
      } else {
        this.saveCallback();
        this.saving = false;
      }
    },
    updateSuccess: function(respObj) {
      var outboxItemId = this.$route.query.outbox_item_id;
      if (outboxItemId && outboxItemId != -1) {
        this.$app.deleteOutboxItem(this.$route.query.outbox_item_id);
      }
      if (this.successMessage) this.$app.modal.showDialog("msg_success", this.successMessage);
      this.saving = false;
      if (this.saveCallback) {
        this.saveCallback(respObj);
      }
    },

/*
    RETURN_APP_ERROR: -2,
    RETURN_ACCESS_DENIED: -3,
*/
    updateFail: function(status, errorMsg, result) {
      var outboxItemId = this.$route.query.outbox_item_id;
      if (status == this.$app.constants.RETURN_INTERNAL_ERROR || status == this.$app.constants.RETURN_NO_CONNECTION) {
        if (outboxItemId && outboxItemId != -1) {
          let opts = this.titleProp || this.summaryProp ? 
          ['msg_retry', 'msg_update_outbox_entry', 'msg_cancel'] : ['msg_retry', 'msg_cancel'];
          this.$app.modal.showDialog("msg_error", errorMsg, opts, 
          this.handleUserResponse);
        } else {
          let opts = this.titleProp || this.summaryProp ? 
          ['msg_retry', 'msg_save_in_outbox', 'msg_cancel'] : ['msg_retry', 'msg_cancel'];
          this.$app.modal.showDialog("msg_error", errorMsg, opts, this.handleUserResponse);
        }
      } else if (status == this.$app.constants.RETURN_LOGIN_REQUIRED) {
        this.saving = false;
        this.redirectToLogin();
      } else if (status == this.$app.constants.RETURN_ACCESS_DENIED) {
        this.$app.modal.showErrorDialog('msg_access_denied');
      } else {
        this.saving = false;
        // We have to call showErrorDialog with localized message argument for component
        // defined error messages to work properly.
        this.$app.modal.showErrorDialog(this.$i18n(errorMsg));
        if (result) {
          for (let prop in result) {
            this.errors[prop] = result[prop];
          }
        }
      }
    },

    handleUserResponse: function(resp) {
      if (resp == 0) {
        this.saveData();
        return;
      } else if (!this.titleProp && !this.summaryProp) {
        this.saving = false;
        return;
      } else if (resp == 1) {
        var outboxItemId = this.$route.query.outbox_item_id;
        if (outboxItemId && outboxItemId != -1) {
          this.$app.upateOutboxItem(outboxItemId, this.$route.path, this.dataObject, this.itemTitle(), this.itemDesc());
        } else {
          this.$app.saveToOutbox(this.$route.path, this.dataObject, this.itemTitle(), this.itemDesc());
        }
        this.$app.modal.showDialog('', 'msg_work_saved_in_outbox');
      }
      this.saving = false;
    },
    redirectToLogin: function() {
      this.$app.loginRedirect(this.componentId, this.actionKey, this.dataObject, this.methodParamObject, this.$route);
    },
    cancelUpdate: function() {
      if (this.cancelCallback) { 
        this.cancelCallback(); 
      } else this.$router.back();
    },

    itemTitle: function() {
      if (this.dataObject[this.titleProp]) return this.dataObject[this.titleProp];
      return this.$i18n('msg_no_title');
    },
    itemDesc: function() {
      if (this.dataObject[this.summaryProp]) return this.dataObject[this.summaryProp];
      return this.$i18n('msg_no_desc');
    }
  }
}
</script>