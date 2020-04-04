<!--
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 -->

<!-- This is not used right now but might be needed in the future if we decide to not save the site
  definition at every change. -->
<template>
  <div class="sp-one-column-container">
    <div class="card sp-card p-1 p-sm-5 mt-3">
      <h4 class="text-center mb-4">{{$i18n('msg_save_site_as')}}</h4>
      <form>
        <sp-form
          :form-def="siteTemplateForm"
          :data-object="saveSettings"
          :errors="errors"
          form-id="siteTemplateForm"
          saver-service="SiteService"
          saver-method="saveSiteDefAs"
          :save-label="$i18n('msg_save')"
          :save-callback="saved"
          :cancel-callback="cancelEdit"
        ></sp-form>
      </form>
    </div>
  </div>
</template>
<script>
"use strict";

export default {
  data: function() {
    return {
      saveSettings: { name: "", overwrite: false },
      errors: {},
      siteTemplateForm: {
        fields: [
          {
            name: "name",
            label: "msg_site_name",
            type: "text",
            required: true
          },
          {
            name: "overwrite",
            label: "msg_overwrite_existing_site",
            type: "checkbox"
          }
        ]
      },

      messages: {
        "en": {
          "msg_site_name": "Site Name",
          "msg_overwrite_existing_site": "Overwrite Existing Site",
          "msg_new_site": "New Site",
          "msg_open_site": "Open Site",
          "msg_save_site_as": "Save Site As",
          "msg_manage_sites": "Manage Sites",
          "msg_site_saved": "Site saved.",
          "error_site_exists": "Site with the same name exists."
        }
      }
    };
  },

  methods: {
    cancelEdit: function() {
      this.$router.back();
    },

    saved: function() {
      this.$app.modal.showSuccessDialog("msg_site_saved", this.savedCB);
    },

    savedCB: function() {
      this.$router.back();
    }
  }
};
</script>