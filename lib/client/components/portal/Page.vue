<!--
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 -->

<template>
  <div :class="config.class == 'sp-sidebar-nav' ? config.wrapperclass : config.class">
    <sp-page v-for="container in config.containers" :key="container.id" :config="container" :target="target" :path="path ? path : config.path"></sp-page>
    <template v-if="config.class == 'sp-sidebar-nav'">
      <div :class="config.sidebarclass">
        <div class="list-group">
          <div v-for="comp in config.components" :id="'comp-' + comp.id" :key="comp.id" class="list-group-item list-group-item-action" 
          :class="{active: targetComponentId == comp.id}"
           style="cursor: pointer;" @click.prevent.stop="$router.push('/' + path + '/' + comp.id)"
          :draggable="isDraggable()"
          @dragend="dragEnd()"
          @dragover="dragOver($event)"
          @dragstart="dragStart($event)"
          @drop="drop($event)"

          >{{getTitle(comp)}}</div>
        </div>
        <div :id="'comp--' + config.id" class="sp-last-component mt-1" :class="{'sp-empty-column': !config.components || config.components.length == 0}" 
        @dragover="dragOver($event)"
          v-if="$root.isEditMode && (!config.containers || config.containers.length == 0)">
          <span v-if="!config.components || config.components.length == 0"></span>
        </div>
        <div v-if="$root.isEditMode && (!config.containers || config.containers.length == 0)">
          <form class="form-inline">
            <select class="form-control mr-2" :id="'comp-select-' + config.id">
              <option v-for="option in $app.appComponents" v-bind:value="option[0]" :key="option[0]">
                {{ option[0] }}
              </option>
            </select>
            <button type="submit" @click.prevent="addComponent()" class="btn btn-primary">{{$i18n('msg_add')}}</button>
          </form>
        </div>
      </div>
      <div :class="config.contentclass">
        <template v-if="targetComponent">
        <sp-component :component="targetComponent" :id="'sbcomp-' + targetComponentId" drag-disabled="true"></sp-component>
        </template>
      </div>
    </template>
    <template v-else>
      <sp-component v-for="comp in config.components" :component="comp" :key="comp.id" :id="'comp-' + comp.id" :cclass="config.cclass"></sp-component>
      <div :id="'comp--' + config.id" class="sp-last-component" :class="{'sp-empty-column': !config.components || config.components.length == 0}" 
      @dragover="dragOver($event)"
        v-if="$root.isEditMode && (!config.containers || config.containers.length == 0)">
        <span v-if="!config.components || config.components.length == 0">{{$i18n('msg_drop_widget')}}</span>
      </div>
      <div v-if="$root.isEditMode && (!config.containers || config.containers.length == 0)" class="d-flex align-self-center text-center justify-content-center">
        <form class="form-inline">
          <select class="form-control mr-2" :id="'comp-select-' + config.id">
            <option v-for="option in $app.appComponents" v-bind:value="option[0]" :key="option[0]">
              {{ option[0] }}
            </option>
          </select>
          <button type="submit" @click.prevent="addComponent()" class="btn btn-primary">{{$i18n('msg_add')}}</button>
        </form>
      </div>
    </template>
  </div>
</template>
<script>
'use strict';
import SPComponent from './Component.vue';
export default {
  components: {
    "sp-component": SPComponent
  },
  computed: {
    targetComponentId: function() {
      if (this.target) return this.target;
      else if (this.config.components && this.config.components.length > 0) return this.config.components[0].id;
      else return -1;
    },
    targetComponent: function() {
      var id = this.targetComponentId;
      if (id == -1) return null;
      for (let i=0; i<this.config.components.length; i++) if (this.config.components[i].id == id) return this.config.components[i];
      return null;
    }
  },

  data: function() {
    return { }
  },
  // Path prop is only needed for menu layout so that it can figure out the current page path
  // and generate menu links. Original implementation used $root.currentPage but that does not
  // work since it returns the page before user navigates to the menu page.
  props: ['config', 'target', 'path'],

  methods: {
    isDraggable: function() {
			return this.$app.user && this.$app.user.isSuperadmin && this.$root.isEditMode;
		},

    dragEnd: function() {
      this.$app.portalEditor.dragEnd(this.$app.site.siteDef);
    },

    dragStart: function(event) {
      this.$app.portalEditor.dragStart(event);
    },
    dragOver: function(event) {
      this.$app.portalEditor.dragOver(event, this.$root.currentPage);
    },

    drop: function(event) {
      /* Calling preventDefault is critical for Firefox, otherwise it will try to
      redirect the browser to the data set in dataTransfer object set in dragStart method in portal_editor
      */
      event.preventDefault();
    },

    addComponent: function() {
      this.$app.portalEditor.addComponent(document.getElementById('comp-select-' + this.config.id).value, this.config.components, this.$app.site.siteDef);
    },

    getTitle: function(comp) {
      if (comp.title) return comp.title;
      var title = comp.name;
      if (comp.name.startsWith('sp-')) title = title.substring(3);
      return this.$app.util.toTitleCase(title, true);
    }
  }
}

</script>