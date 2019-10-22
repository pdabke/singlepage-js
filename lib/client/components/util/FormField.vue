<!--
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 -->
<template>
  <!-- Hidden -->
  <div v-if="field.type == 'hidden'">
    <input type="hidden" v-bind:name="field.name" v-model="formData[field.name]" />
  </div>

  <!-- Label for text, textarea, password, select, html, file -->
  <div
    v-else-if="!field.type || field.type == 'text' || field.type == 'textarea' || field.type == 'password' || field.type == 'select' 
    || field.type == 'html' || field.type == 'file'"
    class="form-group"
    :class="{'form-row': horizontal}"
  >
    <label
      v-if="field.label != null"
      v-bind:for="field.name"
      v-bind:class="{ 'sp-required' : field.required, 'col-sm-3 col-form-label text-right': horizontal }"
    >{{$i18n(field.label)}}</label>
    <div :class="{'col-sm-9': horizontal}">
      <!-- Text -->
      <input
        v-if="(!field.type || field.type == 'text') && field.dataType != $app.constants.DATA_TYPE_FLOAT"
        class="form-control"
        :class="{'is-invalid': errorMessage}"
        type="text"
        v-bind:name="field.name"
        v-bind:placeholder="$i18n(field.placeholder)"
        v-on:blur="validate"
        v-model="formData[field.name]"
      />
      <input
        v-else-if="(!field.type || field.type == 'text') && field.dataType == $app.constants.DATA_TYPE_FLOAT"
        class="form-control"
        :class="{'is-invalid': errorMessage}"
        type="text"
        v-bind:name="field.name"
        v-bind:placeholder="$i18n(field.placeholder)"
        v-on:blur="validate"
        v-model.number="formData[field.name]"
      />

      <!-- Textarea -->
      <textarea
        v-else-if="field.type == 'textarea'"
        class="form-control"
        :class="{'is-invalid': errorMessage}"
        v-bind:name="field.name"
        v-on:blur="validate"
        :rows="field.rows"
        v-bind:placeholder="$i18n(field.placeholder)"
        v-model="formData[field.name]"
      ></textarea>

      <!-- Select -->
      <select
        v-else-if="field.type == 'select'"
        class="form-control"
        :class="{'is-invalid': errorMessage}"
        v-bind:name="field.name"
        v-bind:multiple="field.multiple"
        v-model="formData[field.name]"
        v-on:blur="validate"
      >
        <option
          v-for="opt in field.options"
          :key="opt.value"
          :value="opt.value"
        >{{$i18n(opt.label)}}</option>
      </select>

      <!-- Password -->
      <input
        v-else-if="field.type == 'password'"
        class="form-control"
        :class="{'is-invalid': errorMessage}"
        type="password"
        v-bind:name="field.name"
        v-on:blur="validate"
        v-model="formData[field.name]"
      />

      <!-- HTML -->
      <div
        v-else-if="field.type == 'html'"
        class="sp-form-input"
        :class="{'is-invalid': errorMessage}"
      >
        <component
          :is="getWysiwygComponent()"
          :field="field"
          :form-data="formData"
          @blur="validate"
          :class="{'is-invalid': errorMessage}"
        ></component>
      </div>

      <!-- File -->
      <input
        v-else-if="field.type == 'file'"
        type="file"
        v-bind:name="field.name"
        v-on:blur="validate"
      />
      <div class="invalid-feedback">{{errorMessage}}</div>
    </div>
  </div>

  <!-- Radio -->
  <div v-else-if="field.type == 'radio'" class="form-group" :class="{'form-row': horizontal}">
    <label
      v-if="field.label != null"
      v-bind:for="field.name"
      v-bind:class="{ 'sp-required' : field.required, 'col-sm-3 text-right': horizontal}"
    >{{$i18n(field.label)}}</label>
    <div :class="{'col-sm-9': horizontal}">
      <div
        v-for="opt in field.options"
        :key="opt.value"
        class="form-check custom-control custom-radio"
        :class="{'is-invalid': errorMessage, 'custom-control-inline': field.inline}"
      >
        <input
          type="radio"
          class="custom-control-input"
          :class="{'is-invalid': errorMessage}"
          v-bind:name="field.name"
          :id="field.name + formId + opt.value"
          :value="opt.value"
          v-model="formData[field.name]"
          v-on:blur="validate"
        />
        <label :for="field.name + formId + opt.value" class="custom-control-label">{{opt.label}}</label>
      </div>
      <div class="invalid-feedback">{{errorMessage}}</div>
    </div>
  </div>

  <!-- Checkbox -->
  <div v-else-if="field.type == 'checkbox'" class="form-group" :class="{'form-row': horizontal}">
    <div class="form-check custom-control custom-checkbox">
      <input
        type="checkbox"
        class="custom-control-input"
        :class="{'is-invalid': errorMessage}"
        :id="formId + field.name"
        v-model="formData[field.name]"
        :name="field.name"
      />
      <label
        v-if="field.label != null"
        class="custom-control-label"
        :for="formId + field.name"
        v-bind:class="{ 'sp-required' : field.required, 'col-sm-3 text-right': horizontal}"
      >{{$i18n(field.label)}}</label>
      <div v-if="errorMessage" class="invalid-feedback">{{errorMessage}}</div>
    </div>
  </div>

  <!-- Group -->
  <div v-else-if="field.type == 'group'" class="form-field-group">
    <div v-bind:class="field.colClass" v-for="f in field.fields" :key="f.name">
      <sp-field v-bind:field="f" v-bind:is-group="true"></sp-field>
    </div>
  </div>
</template>
<script>
"use strict";
export default {
  props: ["field", "formData", "errors", "isGroup", "colClass", "horizontal", "formId", "messages"],
  /* Vue sometimes reuses the same form field instance. This happens, for example, when two forms are displayed by
  the same component and only one is shown via v-if. In that case vue reuses the form instance and some or all
  formField instances that match the properties. That's why we watch formData to detect change in the formData
  and reset error
  */
  watch: {
    formData: function(newData, oldData) {
      // Covers the possibility that one of the other form field values has caused the change in formData
      // the object itself has not changed.
      if (newData === oldData) return; 
      this.fieldError = null;
    },
    errors: function() {
      this.fieldError = this.errors[this.field.name];
    },
    fieldError: function() {
      this.$emit("update-field-error", {name: this.field.name, error: this.fieldError})
    }
  },
  data: function() {
    return {
      fieldError: null
    };
  },
  computed: {
    errorMessage: function() {
      if (!this.errors[this.field.name]) return "";
      var key = this.errors[this.field.name] + "";
      if (this.field.messages && this.field.messages[key])
        key = this.field.messages[key];
      var secondArg = this.$app.i18n.computeErrorArg(key, this.field);
      return this.$i18n(key, {field: this.$i18n(this.field.label), limit: secondArg});
    }
    
 },
  methods: {
    getWysiwygComponent: function() {
      return 'sp-textarea';
    },
/*    validate: function() {
      this.errors[this.field.name] = this.$app.validator.validateField(
        this.field,
        this.formData[this.field.name],
        this.errors
      );
    },
*/
    validate: function(/*target*/) {
      var fieldError = this.$app.validator.validateField(
        this.field,
        this.formData[this.field.name],
        this.errors
      );
      this.$emit("update-field-error", {name: this.field.name, error: fieldError})
    },

    dataURItoBlob: function(dataURI) {
      // convert base64 to raw binary data held in a string
      // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
      var byteString = atob(dataURI.split(",")[1]);

      // separate out the mime component
      var mimeString = dataURI
        .split(",")[0]
        .split(":")[1]
        .split(";")[0];

      // write the bytes of the string to an ArrayBuffer
      var ab = new ArrayBuffer(byteString.length);
      var ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      //Old Code
      //write the ArrayBuffer to a blob, and you're done
      //var bb = new BlobBuilder();
      //bb.append(ab);
      //return bb.getBlob(mimeString);

      //New Code
      return new Blob([ab], { type: mimeString });
    }
  }
};
</script>