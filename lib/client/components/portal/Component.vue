<!--
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 -->

<template>
  <div
    :id="'comp-' + component.id"
    class="sp-component"
    v-bind:class="componentClass"
    :draggable="isDraggable()"
    @drop="drop($event)"
    @dragend="dragEnd($event)"
    @dragover="dragOver($event)"
    @dragstart="dragStart($event)"
  >
    <div class="sp-component-action-menu" v-if="actions && $root.isEditMode">
      <sp-dropdown class="d-inline-block" :items="actions" align="right">
        <div class="sp-menu-icon">
          <img :src="$app.config.CDN_URL + '/images/settings.svg'">
        </div>
      </sp-dropdown>
      <div v-if="$app.user && $app.user.isSuperadmin"  class="d-inline-block" style="cursor: move;"
        @mousedown="toggleDrag(true)" @mouseup="toggleDrag(false)">
        <img :src="$app.config.CDN_URL + '/images/drag.svg'" draggable="false">
      </div>
    </div>
    <div v-if="title" v-bind:class="headerClass">{{$i18n(title)}}</div>
    <div v-bind:class="bodyClass" v-show="mode == 0">
      <component
        :is="component.name"
        :id="component.id"
        v-bind="typedConfig"
        @update:title="updateTitle"
        :auto-saved-state="autoSavedState"
        ref="realComponent"
      ></component>
    </div>
    <div v-if="mode == 1" class="card-body">
      <sp-form
        :form-def="settingsFormDef"
        :data-object="settingsData.config"
        :method-param-object="settingsData"
        save-label="msg_save_settings"
        saver-service="SiteService"
        saver-method="setComponentConfig"
        success-message="msg_settings_saved_successfully"
        :save-callback="saved.bind(this)"
        :cancel-callback="editCancelled.bind(this)"
        :component-id="component.id"
        action-key="sk:save_site_config"
      ></sp-form>
    </div>
    <div v-if="mode == 2" class="card-body">
      <sp-form
        :form-def="metadataFormDef"
        :data-object="component"
        saver-service="SiteService"
        saver-method="saveSiteDef"
        :method-param-object="metadata"
        save-label="msg_save_metadata"
        :save-callback="editMetadataDone.bind(this)"
        success-message="msg_metadata_saved"
        :cancel-callback="editMetadataDone.bind(this)"
      ></sp-form>
    </div>
  </div>
</template>
<script>
"use strict";
import SPClickOutside from "../../scripts/clickoutside.js";
export default {
  directives: {
    ClickOutside: SPClickOutside
  },

  watch: {
    // The following is needed currently only for menu layouts. When a user selects another menu option,
    // Vue reuses the same instance of Component.vue and
    // if the new component does not throw update:actions event then the old actions still remain cached
    // and the action menu will reflect settings for the old component.
    component: function(oldVal, newVal) {
      // For some reason we receive this event in the edit mode when a newly created component metadata
      // title is being edited. When you type in the first letter in the Title field, it receives this
      // call and switches the mode to 0
      if (oldVal && newVal && oldVal.id == newVal.id) return;
      this.mode = 0;
      this.tryActionsUpdate(200);
    }

  },

  mounted: function() {
    // The following is required to avoid vue warning when the component roles are undefined or null:
    // [Vue warn]: <select multiple v-model="formData[field.name]"> expects an Array value for its binding, but got Undefined
    if (!this.component.roles) this.component.roles = [];

    this.mode = 0;
    this.tryActionsUpdate();

    // Check if we are coming here after login redirect sequence

    var lastState = this.$app.getPreLoginState(this.component.id);
    if (lastState) {
      if (lastState.action_key == "sk:save_site_config") {
        this.showSettingsEditorHelper(lastState.data_object);
      } else {
        this.autoSavedState.lastState = lastState;
      }
    } else {
      this.autoSavedState.lastState = null;
    }
  },
  props: ['component', 'dragDisabled', 'cclass'],
  data: function() {
    return {
      handleDrag: false,
      mode: 0,
      sktitle: null,
      prefsFormDef: null,
      settingsFormDef: null,
      commands: null,
      settingsData: { siteId: null, component_id: null, config: null },
      oldSettings: null,
      preferenceData: {
        siteId: null,
        user_id: null,
        component_id: null,
        config: null
      },
      autoSavedState: { lastState: null },
      showDropdown: false,
      metadata: { siteDef: this.$root.site.siteDef },
      metadataFormDef: {
        fields: [
          { name: "title", label: "msg_title", type: "text" },
          {
            name: "template",
            label: "msg_template",
            type: "select",
            options: this.$app.componentTemplates.getTemplateList()
          },
          {
            name: "roles",
            label: "msg_access_roles",
            multiple: true,
            options: this.$app.constants.ROLES,
            type: "select"
          }
        ]
      }
    };
  },
  computed: {
    typedConfig: function() {
      /*
      if (!this.settingsFormDef) return this.component.config;
      var containsObj = false;
      for (let i=0; i<this.settingsFormDef.fields.length; i++) {
        if (this.settingsFormDef.fields[i].dataType == 'object' || this.settingsFormDef.fields[i].dataType == 'array') containsObj = true;
      }
      if (!containsObj) return this.component.config;
      var newConfig = {};
      for (let i=0; i<this.settingsFormDef.fields.length; i++) {
        let fname = this.settingsFormDef.fields[i].name;
        if (!this.component.config[fname]) continue;
        if (this.settingsFormDef.fields[i].dataType == 'object' || this.settingsFormDef.fields[i].dataType == 'array') {
          try {
            newConfig[fname] = JSON.parse(this.component.config[fname]);
          } catch (e) {
            console.error(e);
          }
        } else {
          newConfig[fname] = this.component.config[fname];
        }
      }
      console.log(JSON.stringify(this.component.config))
      console.log(JSON.stringify(newConfig));
      return newConfig;
      */
      
      if (!this.component || !this.component.config) return {};
      if (!this.$app.componentMap[this.component.name]) return this.component.config;
      if (!this.$app.componentMap[this.component.name][3]) return this.component.config;
      var newConfig = {};
      var objectFields = this.$app.componentMap[this.component.name][3];
      if (!objectFields) return this.component.config;
      var keys = Object.keys(this.component.config);
      if (!keys || keys.length == 0) return this.component.config;
      for (let ii=0; ii<keys.length; ii++) {
        let key = keys[ii];
        if (objectFields[key]) newConfig[key] = JSON.parse(this.component.config[key]);
        else newConfig[key] = this.component.config[key];
      }
      return newConfig;
      
    },
    actions: function() {
      if (!this.$app.user) return null;
      let menuOptions = [];
      
      if (this.commands) {
        for (let i = 0; i < this.commands.length; i++)
          menuOptions.push({
            name: this.commands[i].name,
            label: this.commands[i].label,
            icon: this.commands[i].icon,
            callback: this.wrapCommand(this.commands[i].action)
          });
      }
      if (this.$app.user.isAdmin) {
        if (this.settingsFormDef) {
          menuOptions.push({
            label: "msg_edit_settings",
            callback: this.showSettingsEditor
          });
        }
      }
      if (this.$app.user.isSuperadmin) {
        menuOptions.push({
          label: "msg_edit_metadata",
          callback: this.showMetadataEditor
        });
        menuOptions.push({
          label: "msg_delete_component",
          callback: this.deleteComponent
        });
      }

      /*
			if (this.preferences) {
				menuOptions.push({label: preferences, callback: this.showPreferenceEditor});
			}
			*/
      if (menuOptions.length == 0) return null;
      return menuOptions;
    },
    title: function() {
      if (this.component.title) return this.component.title;
      return this.sktitle;
    },
    componentClass: function() {
      // return this.computeClass(this.component.componentClass, this.componentClass, 'card border-light mb-3');
      var t = this.component.template;
      if (!t) {
        t = "note-default";
      }
      return this.$app.componentTemplates.getTemplate(t).componentClass + (this.cclass ? ' ' + this.cclass : '');
    },
    headerClass: function() {
      // return this.computeClass(this.component.componentClass, this.componentClass, 'card border-light mb-3');
      var t = this.component.template;
      if (!t) {
        t = "note-default";
      }
      return this.$app.componentTemplates.getTemplate(t).headerClass;
    },
    bodyClass: function() {
      // return this.computeClass(this.component.componentClass, this.componentClass, 'card border-light mb-3');
      var t = this.component.template;
      if (!t) {
        t = "note-default";
      }
      return this.$app.componentTemplates.getTemplate(t).bodyClass;
    }
  },

  methods: {
    toggleDrag: function(flag) {
      this.handleDrag = flag;
    },
    /* The use of setTimeout use to update the component actions menu is a bit of hack but it seems
    to be the simplest solution to make sure actions menu reflects the current real component being
    displayed. The basic issue is the fact that async components get mounted a little later after
    Component.vue meta-component is mounted. This happens only in case of the first reference to async 
    component but happens none the less. There is no callback or lifecycle hook to let Component.vue
    know that the real component is ready to go. Considered use of "updated" hook but that fires
    too many times and seems like an overkill for something that is need only the first time the
    async component is referenced. 
    */
    tryActionsUpdate: function(delay) {
      if (delay) {
        setTimeout(this.tryActionsUpdate, delay);
        return;
      }
      if (this.$refs.realComponent) {
        let acts = this.$refs.realComponent.actions ? this.$refs.realComponent.actions : this.$app.componentActions[this.component.name];
        if (typeof acts === "undefined") acts = this.$app.computeComponentActions(this.component.name, this.$refs.realComponent);
        this.updateActions(acts);
      } else {
        setTimeout(this.tryActionsUpdate, 200);
      }
    },
    isDraggable: function() {
      return (
        this.handleDrag && !this.dragDisabled && this.$app.user && this.$app.user.isSuperadmin && this.$root.isEditMode
      );
    },

    drop: function(event) {
      /* Calling preventDefault is critical for Firefox, otherwise it will try to
      redirect the browser to the data set in dataTransfer object set in dragStart method in portal_editor
      */
      event.preventDefault();
    },

    dragEnd: function(event) {
      event.preventDefault();
      this.$app.portalEditor.dragEnd(this.$app.site.siteDef);
      this.handleDrag = false;
    },

    dragStart: function(event) {
      this.$app.portalEditor.dragStart(event);
    },

    dragOver: function(event) {
      event.preventDefault();
      this.$app.portalEditor.dragOver(event, this.$root.currentPage);
    }, 

    hideDropdown: function() {
      this.showDropdown = false;
    },

    toggleDropdown: function() {
      if (this.showDropdown) this.showDropdown = false;
      else this.showDropdown = true;
    },

    updateTitle: function(newTitle) {
      this.sktitle = newTitle;
    },

    updateActions: function(a) {
      if (!a) {
        this.prefsFormDef = null;
        this.settingsFormDef = null;
        this.commands = null;
      } else {
        this.prefsFormDef = a.preferences;
        this.settingsFormDef = a.settings;
        this.commands = a.commands;
      }
    },

    showSettingsEditor: function() {
      this.showSettingsEditorHelper(null);
    },

    showSettingsEditorHelper: function(savedConfig) {
      var theRightConfig =
        this.$app.site.siteData && this.$app.site.siteData.componentConfig &&
        this.$app.site.siteData.componentConfig["sp_" + this.component.id]
          ? this.$app.site.siteData.componentConfig["sp_" + this.component.id]
          : this.component.config;
      if (!theRightConfig) theRightConfig = {};
      this.settingsData.siteId = this.$app.site.id;
      this.settingsData.component_id = this.component.id;
      this.oldSettings = JSON.stringify(theRightConfig);
      this.settingsData.config = savedConfig
        ? savedConfig
        : JSON.parse(this.oldSettings);
      this.mode = 1;
    },

    showMetadataEditor: function() {
      if (!this.component.roles) this.component.roles = [];
      this.mode = 2;
    },

    showPreferenceEditor: function() {},

    deleteComponent: function() {
      this.$app.modal.showDialog(
        "msg_delete_component",
        "msg_confirm_delete_component",
        ["msg_delete_component", "msg_cancel"],
        function(i) {
          if (i == 0)
            this.$app.portalEditor.deleteComponent(
              this.component.id,
              this.$root.currentPage,
              this.$app.site.siteDef
            );
        }.bind(this)
      );
    },

    editCancelled: function() {
      if (JSON.stringify(this.settingsData.config) != this.oldSettings) {
        this.$app.modal.showDialog(
          "",
          "msg_discard_edits_question",
          ["msg_discard_edits", "msg_continue_editing"],
          this.leaveEditResponse
        );
      } else {
         this.mode = 0;
      }
    },

    editMetadataDone: function() {
      this.mode = 0;
    },

    saved: function() {
      if (!this.$app.site.siteData) this.$app.site.siteData = {};
      if (!this.$app.site.siteData.componentConfig)
        this.$app.site.siteData.componentConfig = {};
      this.$app.site.siteData.componentConfig[
        "sp_" + this.component.id
      ] = this.settingsData.config;
      if (!this.component.config) this.component.config = {};
      this.$app.util.mixin(this.component.config, this.settingsData.config);

      // stringify/parse is needed to make Vue aware of the config change. Simply changin config
      // attributes does not seem to refresh the component
      var cfg = JSON.stringify(this.component.config);
      this.component.config = JSON.parse(cfg);
      this.oldSettings = JSON.stringify(this.settingsData.config);
      // The followin is a hack to make config reactive. This allows the component to watch config and update
      // its view
      //this.configChanged = new Date();

      this.mode = 0;
    },
    leaveEditResponse: function(resp, cmd) {
      if (resp == 0) {
        this.mode = 0;
        if (cmd) cmd();
      }
    },
    wrapCommand: function(cmd) {
      return function() {
        this.invokeCommand(cmd);
      }.bind(this);
    },
    invokeCommand: function(cmd) {
      if (
        this.mode == 1 &&
        JSON.stringify(this.settingsData.config) != this.oldSettings
      ) {
        this.$app.modal.showDialog(
          "",
          "msg_discard_edits_question",
          ["msg_discard_edits", "msg_continue_editing"],
          function(resp) {
            this.leaveEditResponse(resp, cmd);
          }.bind(this)
        );
      } else {
        cmd();
        this.mode = 0;
      }
    }
  }
};
</script>