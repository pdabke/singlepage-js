<template>
  <div>
    <!-- div inside a nav is kind of redundant but doing this following accessibility guidelines from Bootstrap
      nav indicates navigation and tablist corresponds to the contains of tabs -->
    <nav>
      <div class="nav" :class="navClass ? navClass : 'nav-tabs'" role="tablist">
        <a v-for="(l, index) in tabs" href="#" :key="l.title" class="nav-item nav-link" role="tab" :id="(l.computedId) + '-tab'"
          :class="{'active': index == selected, 'disabled': l.disabled}"
          :aria-selected="selected == index ? 'true' : 'false'" :aria-controls="$i18n(l.title)"
          @click.prevent.stop="selectLink(index)">{{$i18n(l.title)}}</a>
      </div>
    </nav>
    <!-- overflow hidden helps a better experience for slide transitions -->
    <div style="overflow: hidden;" class="tab-content" :class="contentClass ? contentClass : 'card card-body border-top-0'">
      <slot></slot>
    </div>
  </div>
</template>
<script>
"use strict";
import "./nav.scss";
export default {
  props: ['navClass', 'contentClass', 'transition'],

  data: function() { return { tabs: [], selected: 0}},

  created() {
      this.tabs = this.$children;
  },

  mounted() {
    this.tabs[this.selected].selected = true;
  },

  methods: {
    selectLink(newVal) { 
      this.tabs[this.selected].selected = false;
      this.selected = newVal;
      if (this.transition) setTimeout(this.showNew.bind(this), 500);
      else this.tabs[this.selected].selected = true;
    },
    showNew() {
      this.tabs[this.selected].selected = true;
    }
  }


}
</script>