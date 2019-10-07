<!--
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 -->

<template>
    <ul class="navbar-nav mr-auto">
      <template v-for="link in $root.site.siteDef.pages" >
          <sp-dropdown v-if="link.pages" :key="link.path" class="nav-item" :items="link.pages" type="list">
            <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              {{$i18n(link.label)}}
            </a>
          </sp-dropdown>
          <li v-else :key="link.path" class="nav-item"
              :draggable="isDraggable()"
              @drop="drop($event)"
              @dragend="dragEnd($event)"
              @dragover="dragOver($event)"
              @dragstart="dragStart($event)"
>
            <router-link class="nav-link" :id="'page-' + link.path" :to="'/' + link.path" 
            >{{$i18n(link.label)}}</router-link>
          </li>
      </template>
      <li id="page--1" class="sp-last-component" @dragover="dragOver($event)"
        v-if="$root.isEditMode && $app.user.isSuperadmin">      
      </li>

    </ul>
</template>
<script>
"use strict";
import DropDown from '../util/Dropdown.vue';
export default {
  components: {
    "sp-dropdown": DropDown
  },
  props: ['editable', 'callback', 'ulClass', 'liClass', 'aClass'],

  computed: {
    computeUlClass: function() {
      return this.ulClass ? this.ulClass : "navbar-nav"
    },
    computeLiClass: function() {
      return this.liClass ? this.liClass : "nav-item";
    },
    computeAClass: function() {
      return this.aClass ? this.aClass : "nav-link"
    }
  },

  methods: {
    handleClick: function(event) {
      if (this.callback) this.callback(event);
    },

    isDraggable: function() {
			return this.$app.user && this.$app.user.isSuperadmin && this.$root.isEditMode && this.editable;
    },
    
    drop: function(event) {
      /* Calling preventDefault is critical for Firefox, otherwise it will try to
      redirect the browser to the data set in dataTransfer object set in dragStart method in portal_editor
      */
      event.preventDefault();
    },

    dragEnd: function(event) {
      event.preventDefault();
      this.$app.portalEditor.pageDragEnd(this.$app.site.siteDef);
    },

    dragStart: function(event) {
      // Need to call isDraggable because at least Firefox seems to allow dragging links/images
      // even if isDraggable returns false
      if (!this.isDraggable()) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      this.$app.portalEditor.pageDragStart(event);
    },

    dragOver: function(event) {
      event.preventDefault();
      this.$app.portalEditor.pageDragOver(event, this.$app.site.siteDef);
    }, 
    
    topLevelPages: function(pages) {
      return pages.filter(function(page) {
        return page.isTopLevel;
      });
    }
  }
};
</script>