<!--
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 -->

<template>
  <div class="sp-one-column-container">
    <div class="card sp-card p-1 p-sm-5 mt-3">
      <template v-if="$app.config.IS_MULTI_SITE">
        <h4 class="text-center mb-4">{{$i18n('msg_edit_site_metadata')}}</h4>
        <form>
          <sp-form
            :form-def="siteMetadataForm"
            :data-object="siteSettings"
            :errors="errors"
            form-id="siteMetadataForm"
            saver-service="SiteService"
            saver-method="saveSiteMetadata"
            :save-label="$i18n('msg_save')"
            :save-callback="saved"
            :cancel-callback="cancelEdit"
          ></sp-form>
        </form>
      </template>
      <div v-else>
        <h4>{{$i18n('msg_site_config')}}</h4>
        <p class="text-info py-2">
          {{$i18n('msg_site_config_info')}}
        </p>
        <form>
          <div v-for="(c, index) in siteConfig" :key="index" class="row py-2">
            <div class="col">
              <input type="text" class="form-control" :placeholder="$i18n('msg_param_name')" v-model="c.name">
            </div>
            <div class="col">
              <input type="text" class="form-control" :placeholder="$i18n('msg_param_value')" v-model="c.value">
            </div>
          </div>
          <div class="row py-2">
            <div class="col">
              <input type="submit" name="submit" :value="$i18n('msg_save')" class="btn btn-primary mr-2" @click.stop.prevent="saveSiteConfig">
            </div>
          </div>
        </form>        
      </div>
    </div>
  </div>
</template>
<script>
"use strict";

export default {
  mounted: function() {
    if (this.$app.site.siteData) {
      let sc = this.$app.site.siteData.siteConfig;
      let scA = [];
      if (sc) {
        let keys = Object.keys(sc);
        for (let i=0; i<keys.length; i++) {
          scA.push({name: keys[i], value: sc[keys[i]]});
        }
        if (scA.length < 5) {
          let num = 5 - scA.length;
          for (let i=0; i<num; i++) {
            scA.push({name: '', value: ''});
          }
        }
        this.siteConfig = scA;
      }
    }
  },

  data: function() {
    return {
      siteConfig: [{name: '', value: ''}, {name: '', value: ''}, {name: '', value: ''}, {name: '', value: ''}, {name: '', value: ''}],
      siteSettings: {
        title: this.$root.site.title,
        author: this.$root.site.author,
        keywords: this.$root.site.keywords,
        descr: this.$root.site.descr,
        theme: this.$root.site.theme,
        accessType: this.$root.site.accessType
      },
      errors: {},
      siteMetadataForm: {
        fields: [
          { name: "title", label: "msg_title", type: "text", required: true },
          { name: "author", label: "msg_author", type: "text" },
          { name: "keywords", label: "msg_keywords", type: "text" },
          { name: "descr", label: "msg_description", type: "textarea" },
          {
            name: "accessType",
            label: "msg_access_type",
            type: "select",
            options: this.$app.config.IS_MULTI_SITE
              ? this.$app.constants.MULTI_SITE_ACCESS_TYPES
              : this.$app.constants.SINGLE_SITE_ACCESS_TYPES
          },
          {
            name: "theme",
            label: "msg_theme",
            type: "select",
            options: this.$app.adminData.themes
          }
        ]
      },

      messages: {
        "en": {
          "msg_site_config": "Site Configuration",
          "msg_site_config_info": "Enter parameter name value pairs in the form below and click 'Save'. You can access these parameters in your components via $app.site.siteData.config[param_name]",
          "msg_param_name": "Parameter name",
          "msg_param_value": "Parameter value",
          "msg_site_config_saved": "Site configuration saved successfully",
          "msg_site_metadata_success": "Site metadata saved successfully",
          "error_site_config_save": "Sorry! There was an error in saving site configuraion."
        }
      }
    };
  },

  methods: {
    saveSiteConfig() {
      let newConfig = {};
      for (let i=0; i<this.siteConfig.length; i++) {
        if (this.siteConfig[i].name) {
          newConfig[this.siteConfig[i].name] = this.siteConfig[i].value;
        }
      }
      let siteData = this.$app.siteData;
      if (!siteData) siteData = {};
      siteData.siteConfig = newConfig;
      this.$app.site.siteData = siteData;
      this.$app.rpc.invoke('SiteService', 'saveSiteConfig', {config: newConfig}, this.saveConfigSuccess, this.saveConfigError);
    },

    saveConfigSuccess() {
      this.$app.modal.showSuccessDialog(this.$i18n('msg_site_config_saved'));
    },

    saveConfigError() {
      this.$app.modal.showErrorDialog(this.$i18n('error_site_config_save'));
    },
    cancelEdit: function() {
      this.$router.back();
    },

    saved: function() {
      this.$app.modal.showSuccessDialog("msg_site_metadata_success");
    }
  }
};
</script>