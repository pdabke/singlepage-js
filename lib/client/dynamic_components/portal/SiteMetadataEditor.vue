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
    </div>
  </div>
</template>
<script>
"use strict";

export default {
  data: function() {
    return {
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
      }
    };
  },

  methods: {
    cancelEdit: function() {
      this.$router.back();
    },

    saved: function() {
      this.$app.modal.showSuccessDialog("msg_site_metadata_success");
    }
  }
};
</script>