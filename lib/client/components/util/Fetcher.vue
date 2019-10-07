<template>
  <div>
    <div v-if="error" class="sp-error">{{$i18n(error)}}</div>
    <div v-else-if="!loaded" class="sp-loading">
      <div class="line-scale-pulse-out">
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
    <slot v-else></slot>
  </div>
</template>
<script>
"use strict";
export default {
  props: ["dataSource", "fetchData", "loaded", "error"],
  data: function() {
    return { };
  },

  mounted: function() {
    this.loading = true;
    this.fetchData();
  },

  watch: {
    // call again the method if the route or data source changes
    $route: function() { this.loading = true; this.fetchData(); },
    dataSource: function() { this.loading = true; this.fetchData(); }
  }
}
</script>
  
