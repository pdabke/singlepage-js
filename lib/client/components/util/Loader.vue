<!--
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 -->
<template>
  <div>
    <div v-if="loading" class="sp-loading">
      <div class="line-scale-pulse-out"><div></div><div></div><div></div></div>
    </div>
    <div v-if="error && !errorCb">
      <div class="p-4">
        <div class="text-danger">{{$i18n(error)}}</div>
        <div class="text-center" v-if="this.errorCode == this.$root.constants.RETURN_INTERNAL_ERROR || 
          this.errorCode == this.$root.constants.RETURN_NO_CONNECTION">
          <button class="full-width" v-on:click.prevent="fetchData">{{$i18n('msg_retry')}}</button>
        </div>
        <div class="text-center" v-if="this.errorCode == this.$root.constants.RETURN_LOGIN_REQUIRED">
          <button class="btn btn-primary full-width" v-on:click.prevent="redirectToLogin">{{$i18n('msg_login')}}</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
'use strict';
export default {
  props: ['service', 'method', 'params', 'successCb', 'errorCb'],
  data: function() {
    return {
      error: null,
      errorCode: 0,
      response: {},
      loading: false
    }
  },
  created: function() {
    // fetch the data when the view is created and the data is
    // already being observed
    this.fetchData();
  },
  watch: {
    // call again the method if the route changes
    $route: function() { this.fetchData(); }
  },
  methods: {
    fetchData: function() {

      // Outbox functionality was implemented for a mobile app. Leaving it here for now since
      // it will be useful once we take up the mobile app support once again
      var outboxItemId = this.$route.query.outbox_item_id;
      if (outboxItemId && outboxItemId != -1) {
        var retryData = this.$app.getOutboxItemData(outboxItemId)
        if (retryData) {
          this.response = this.retryData;
          this.error = null;
          // this.$emit('update:response', retryData);
          this.successCb(retryData);
          return;
        } 
      } else if (this.$app.lastData != null && this.$app.lastLocation == this.$route.path) {
          this.response = this.$app.lastData;
          this.error = null;
          // this.$emit('update:response', this.$app.lastData);
          this.successCb(this.$app.lastData);
          this.$app.lastLocation = '/';
          this.$app.lastData = null;
          return;
      }
      this.loading = true;
      this.error = null;
      this.response = {};
      this.$app.rpc.invoke(
        this.service,
        this.method,
        this.params,
        this.fetchDataSuccess,
        this.fetchDataFail
      );
    },
    fetchDataSuccess: function(respObj) {
      this.response = respObj;
      this.error = null;
      this.loading = false;
      // this.$emit('update:response', respObj);
      this.successCb(respObj);
    },

    fetchDataFail: function(status, errorMsg, result) {
      this.loading = false;
      this.error = errorMsg;
      this.errorCode = status;
      if (this.errorCb) this.errorCb(status, errorMsg, result);
    },

    redirectToLogin: function() {
      this.$app.showLoginPage(true);
    }
  }
}
</script>