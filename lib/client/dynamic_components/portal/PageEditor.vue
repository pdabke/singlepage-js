<!--
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 -->

<template>
  <div class="sp-one-column-container">
    <div v-if="currentPage" class="card sp-card p-1 p-sm-5 mt-3">
      <sp-form
        :form-def="pageForm"
        :data-object="pageSettings"
        :errors="errors"
        form-id="pageEditorForm"
        :save-label="pageAction"
        :save-callback="savePage"
        :cancel-callback="cancelEdit"
      ></sp-form>
    </div>
    <div v-else class="d-flex middle align-items-center justify-content-center">
        <i class="material-icons md-36 mr-3" style="color:red;">warning</i><span class="h2 m-0">{{this.$i18n('error_cannot_edit_current_page')}}</span>
    </div>
    
  </div>
</template>
<script>
"use strict";
export default {
  mounted: function() {
    this.updatePageSettings();
  },

  watch: {
    "$route.query.page": function() {
      this.updatePageSettings();
    }
  },

  data: function() {
    return {
      currentPage: true,
      pageSettings: {
        path: "",
        label: "",
        layout: "",
        roles: [],
        isTopLevel: true,
        folder: null
      },
      errors: {},
      pageForm: {
        fields: [
          {
            name: "path",
            label: "msg_path",
            type: "text",
            required: true,
            customValidator: this.validatePath
          },
          { name: "label", label: "msg_label", type: "text", required: true },
          {
            name: "layout",
            label: "msg_layout",
            type: "select",
            options: this.$app.adminData.pageLayouts.layoutList,
            required: true
          },
          {
            name: "roles",
            label: "msg_access_roles",
            type: "select",
            multiple: true,
            options: this.$app.constants.ROLES
          },
          { name: "isTopLevel", label: "msg_top_level", type: "checkbox" }
        ]
      }
    };
  },

  computed: {
    pageTitle: function() {
      if (this.$route.query.page) {
        return this.$i18n("msg_edit_page_metadata");
      } else {
        return this.$i18n("msg_create_new_page");
      }
    },

    pageAction: function() {
      if (this.$route.query.page) return "msg_save_metadata";
      else return "msg_create_page";
    }
  },

  methods: {
    validatePath: function(field, fieldValue) {
      if (this.$app.getPage(fieldValue)) {
        if (fieldValue != this.$route.query.page)
          return "error_duplicate_page_path";
      } else if (!/^[a-z0-9]+$/i.test(fieldValue)) {
        return "error_invalid_page_path";
      }
      return null;
    },

    cancelEdit: function() {
      this.$router.back();
    },

    savePage: function() {
      if (this.$route.query.page)
        this.$app.editPage(
          this.$route.query.page,
          this.pageSettings
        );
      else
        this.$app.createPage(this.pageSettings);
    },

    updatePageSettings: function() {
      if (this.$route.query.page) {
        var pageConfig = this.$app.getPage(this.$route.query.page);
        if (! pageConfig) {
          this.currentPage = false;
          return;
        }
        this.currentPage = true;
        this.pageSettings.path = pageConfig.path;
        this.pageSettings.label = pageConfig.label;
        this.pageSettings.layout = pageConfig.layout;
        this.pageSettings.roles = pageConfig.roles;
        this.pageSettings.isTopLevel = pageConfig.isTopLevel;
        this.pageSettings.folder = pageConfig.folder;
        if (!this.pageSettings.roles) this.pageSettings.roles = [];
      } else {
        this.currentPage = true;
        this.pageSettings.path = "";
        this.pageSettings.label = "";
        this.pageSettings.layout = "";
        this.pageSettings.roles = [];
        this.pageSettings.isTopLevel = true;
        this.pageSettings.folder = null;
        this.pageSettings.roles = [];
      }
    }
  }
};
</script>