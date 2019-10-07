<!--
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 -->

<template>
<div>
  <div v-if="mode == 0" v-html="publishedContent"></div>
  <div v-else v-html="draftContent"></div>
</div>
</template>
<script>
"use strict";

export default {
  props: ["content", "draft"],
  data: function() {
    return {
      mode: 0,
      actions: {
        settings: 
          {
            fields: [
              { name: 'content', required: true, label: 'msg_published_content', rows: 6, type: 'textarea'},
              { name: 'draft', label: 'msg_draft_content',  rows: 6, type: 'textarea'}
            ]
          },
        commands: [
          {
            name: "view-draft",
            icon: "assignment",
            label: "msg_view_draft",
            action: this.viewDraft.bind(this)
          },
          {
            name: "view-published",
            icon: "description",
            label: "msg_view_published",
            action: this.viewPublished.bind(this)
          }
        ]
      }
    };
  },
  mounted: function() {
    this.$emit("update:actions", this.actions);
  },
  computed: {
    publishedContent: function() {
      if (this.content) {
        let dc = this.content.replace(/{{CDN_URL}}/g, this.$app.config.CDN_URL);
        return dc.replace(/{{SERVICE_URL}}/g, this.$app.config.SERVICE_URL)
      } else {
        return '';
      }
    },

    draftContent: function() {
      if (this.draft) {
        let dc = this.draft.replace(/{{CDN_URL}}/g, this.$app.config.CDN_URL);
        return dc.replace(/{{SERVICE_URL}}/g, this.$app.config.SERVICE_URL)
      } else {
        return '';
      }
    }

  },

  methods: {
    viewPublished: function() {
      this.mode = 0;
    },
    viewDraft: function() {
      this.mode = 1;
    }
  }
};
</script>