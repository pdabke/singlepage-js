<!--
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 -->

<template>
  <div class="sp-one-column-container">
    <div class="card sp-card p-1 p-sm-4 mt-3">
      <h4 class="mb-4">{{$i18n('msg_page_manager')}}</h4>
      <ul class="nav nav-pills mb-3">
        <li class="nav-item">
          <a class="nav-link" :class="{'active': mode == 0}" href="#" @click.prevent="mode = 0">{{$i18n('msg_home')}}</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" :class="{'active': mode == 1}" href="#" @click.prevent="mode = 1">{{$i18n("msg_new_page")}}</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" :class="{'active': mode == 2}" href="#" @click.prevent="mode = 2" >{{$i18n("msg_new_folder")}}</a>
        </li>
      </ul>

      <sp-tree-editor v-if="mode == 0" :node="{ pages: $root.site.siteDef.pages}" child-key="pages" 
        new-leaf-label="msg_new_page" new-non-leaf-label="msg_new_folder" 
        @save-tree="saveSiteDef" @edit-node="setEditNode" @delete-node="deleteNode">
      </sp-tree-editor>
      <div v-else-if="mode == 1">
        <sp-form :form-def="pageForm" :data-object="pageSettings" :errors="pageErrors" form-id="pageForm" 
        save-label="msg_create_page" :save-callback="savePage" :cancel-callback="cancelEdit"></sp-form>
      </div>
      <div v-else-if="mode == 2">
        <sp-form :form-def="folderForm" :data-object="folderSettings" :errors="folderErrors" form-id="folderForm" 
        save-label="msg_save_folder" :save-callback="saveFolder" :cancel-callback="cancelEdit"></sp-form>
      </div>
      <div v-else-if="mode == 3">
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="#" @click.prevent="mode=0">{{$i18n('msg_home')}}</a></li>
            <li class="breadcrumb-item active" aria-current="page">{{$i18n('msg_edit_page_metadata')}}</li>
          </ol>
        </nav>
        <sp-form :form-def="pageForm" :data-object="pageSettings" :errors="pageErrors" form-id="pageForm" 
        save-label="msg_save_metadata" :save-callback="savePage" :cancel-callback="cancelEdit"></sp-form>
      </div>
      <div v-else-if="mode == 4">
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="#" @click.prevent="mode=0">{{$i18n('msg_home')}}</a></li>
            <li class="breadcrumb-item active" aria-current="page">{{$i18n('msg_edit_folder')}}</li>
          </ol>
        </nav>
        <sp-form :form-def="folderForm" :data-object="folderSettings" :errors="folderErrors" form-id="folderForm" 
        save-label="msg_save_folder" :save-callback="saveFolder" :cancel-callback="cancelEdit"></sp-form>
      </div>
    </div>
  </div>
</template>
<script>
"use strict";

export default {
  props: ["id", "config"],
  data: function() {
    return { 
      mode: 0,
      editPage: null,
      pageSettings: {path: '', label: '', layout: '', roles: [], isTopLevel: true, folder: null},
      pageErrors: {},
      editFolder: null,
      folderSettings: {label: '', roles: []},
			folderErrors: {},
      pageForm: {
        fields: [
          { name: 'path', label: 'msg_path', type: 'text', required: true, customValidator: this.validatePath},
          { name: 'label', label: 'msg_label', type: 'text', required: true},
          { name: 'layout', label: 'msg_layout', type: 'select', options:  this.$app.adminData.pageLayouts.layoutList, required: true},
          { name: 'roles', label: 'msg_access_roles', type: 'select', multiple: true, options: this.$app.constants.ROLES},
          { name: 'isTopLevel', label: 'msg_top_level', type: "checkbox"}
        ]
      },
      folderForm: {
        fields: [
          { name: 'label', label: 'msg_label', type: 'text', required: true},
          { name: 'roles', label: 'msg_access_roles', type: 'select', multiple: true, options: this.$app.constants.ROLES}
        ]
      }
    }
  },

  methods: {
    saveSiteDef: function(successCB) {
      this.$app.rpc.invoke("SiteService", "saveSiteDef", {"siteDef": this.$app.site.siteDef}, successCB, this.siteDefSaveError);
    },

    siteDefSaveError: function() {
      this.$app.modal.showErrorDialog("msg_failed_to_save_site_def");
    },

    validatePath: function(field, fieldValue) {
      if (this.$app.getPage(fieldValue)) {
        if (this.$app.getPage(fieldValue) !== this.editPage) return 'error_duplicate_page_path';
      } else if (!/^[a-z0-9]+$/i.test(fieldValue)) {
        return 'error_invalid_page_path';
      }
      return null;
    },

    cancelEdit: function() {
      this.mode = 0;
    },

    savePage: function() {
      if (this.editPage)
        this.$app.editPage(this.editPage.path, this.pageSettings, true);
      else
        this.$app.createPage(this.pageSettings, true);
      this.editPage = null;
      this.pageSettings = {path: '', label: '', layout: '', roles: [], isTopLevel: true, folder: null}; 
      this.mode = 0;
    },

    saveFolder: function() {
      if (this.editFolder) {
        this.editFolder.label = this.folderSettings.label;
        this.editFolder.roles = this.folderSettings.roles;
      } else {
        var folder = {};
        folder.roles = this.folderSettings.roles;
        folder.pages = [];
        folder.label = this.folderSettings.label;
        this.$app.site.siteDef.pages.push(folder);
      }
      this.saveSiteDef();
      this.editFolder = null;
      this.folderSettings = {label: '', roles: []}; 
      this.mode = 0;
    },

    setEditNode: function(page) {
      if (page.pages) {
        // This is a folder
        this.editFolder = page;
        this.folderSettings = JSON.parse(JSON.stringify(page));
        // Need to do this to avoid vue error about expecting arrays in multi-selects
        if (!this.folderSettings.roles) this.folderSettings.roles = [];
        this.folderErrors = {};
        this.mode = 4;
      } else {
        this.editPage = page;
        this.pageSettings = JSON.parse(JSON.stringify(page));
        // Need to do this to avoid vue error about expecting arrays in multi-selects
        if (!this.pageSettings.roles) this.pageSettings.roles = [];
        this.pageErrors = {};
        this.mode = 3;
      }
    },

    deleteNode: function(delInfo) {
      var parent = delInfo.parent;
      var index = delInfo.index;
      var msgLabel = null;
      var delLabel = null;
      if (delInfo.node.pages) {
        // This is a folder
        msgLabel = this.$i18n('msg_confirm_delete_named_entity', {entity: this.$i18n('msg_folder').toLowerCase(), name: this.$i18n(delInfo.node.label)});
        delLabel = this.$i18n('msg_delete_entity', {entity: this.$i18n('msg_folder').toLowerCase()});
      } else {
        msgLabel = this.$i18n('msg_confirm_delete_named_entity', {entity: this.$i18n('msg_page').toLowerCase(), name: this.$i18n(delInfo.node.label)});
        delLabel = this.$i18n('msg_delete_entity', {entity: this.$i18n('msg_page').toLowerCase()});
      }
      this.$app.modal.showDialog(delLabel, msgLabel, [delLabel, 'msg_cancel'],
      function(i) {
        if (i == 0) {
          parent.pages.splice(index, 1);
          this.saveSiteDef();
        }
      }.bind(this));
    }
  }
};
</script>