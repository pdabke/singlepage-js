<!--
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 -->

<template>
  <form v-if="formDef">
    <sp-form-field v-on:update-field-error="updateFieldError" v-for="field in formDef.fields" :key="field.name" :field="field" :form-data="dataObject" :horizontal="formDef.horizontal"
    :errors="errors" :form-id="formId" :messages="messages" ></sp-form-field>
    <div class="form-button-row">
      <sp-saver :form-def="formDef" :data-object="dataObject" :method-param-object="saverObject" v-on:validation-error="handleValidationError" :save-label="saveLabel" 
      :service="saverService" :messages="messages"
      :method="saverMethod" :success-message="successMessage" :title-prop="titleProp" :summary-prop="summaryProp" 
      :save-callback="saveCallback" :cancel-callback="cancelCallback" :action-key="actionKey" :component-id="componentId"></sp-saver>
    </div>
  </form>
  <div v-else>Missing form definition.</div>
</template>
<script>
"use strict";
export default {
  props: ['formDef', 'dataObject', 'methodParamObject', 'saveLabel', 'saverService', 'saverMethod', 
  'successMessage', 'titleProp', 'summaryProp', 'cancelCallback', 'saveCallback', 'actionKey', 'componentId',
  'messages'],
  data: function() {
    return {
      formId: Math.floor(Math.random() * Math.floor(100000)),
      errors: {}
    }
  },

  watch: {
    formDef: function() {
      this.errors = {};
    }
  },
  computed: {
    saverObject: function() {
      if (this.methodParamObject) return this.methodParamObject;
      return this.dataObject;
    }
  },
  methods: {
    updateFieldError: function(errorInfo) {
      this.errors[errorInfo.name] = errorInfo.error;
      // Since we cannot instantiate the errors object attributes corresponding to fields (since they are dynamic),
      // we reassign errors objects to enable reactivity
      this.errors = JSON.parse(JSON.stringify(this.errors));
    },

    handleValidationError: function(errs) {
      this.errors = errs;
      this.$app.modal.showErrorDialog('error_please_correct_errors');
    }
  }
};
</script>