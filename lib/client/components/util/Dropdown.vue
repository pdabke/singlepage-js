<!--
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 -->

<template>
  <li v-if="type == 'list'" :class="valign == 'up' ? 'dropup' : 'dropdown'" @click.prevent="toggleDropdown" v-click-outside="hideDropdown">
      <slot></slot>
      <div class="dropdown-menu" aria-labelledby="dropdownMenuButton" :class="{'dropdown-menu-right': align == 'right', 'show': showDropdown}">
        <a v-for="item in items" :key="item.label" class="dropdown-item" href="#" @click.stop.prevent="handleClick(item)">{{$i18n(item.label)}}</a>
      </div>
  </li>
  <div v-else class="dropdown" @click.prevent="toggleDropdown" v-click-outside="hideDropdown">
      <slot></slot>
      <div class="dropdown-menu" aria-labelledby="dropdownMenuButton" :class="{'dropdown-menu-right': align == 'right', 'show': showDropdown}">
        <a v-for="item in items" :key="item.label" class="dropdown-item" href="#" @click.stop.prevent="handleClick(item)">{{$i18n(item.label)}}</a>
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
  props: ["items", 'align', 'valign', 'type'],
  data: function() {
    return { showDropdown: false };
  },
  methods: {
    hideDropdown: function() {
      this.showDropdown = false;
    },

    toggleDropdown: function() {
      if (this.showDropdown) this.showDropdown = false;
      else this.showDropdown = true;
    },

    handleClick: function(item) {
        this.hideDropdown();
        if (item.callback) {
            item.callback(item);
        } else {
          let realPath = item.path.startsWith('/') ? item.path : '/' + item.path;
            this.$router.push(realPath);
        }
    }
  }
};
</script>