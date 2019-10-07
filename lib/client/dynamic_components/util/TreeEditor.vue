<!--
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 -->

<style>
  .te-draggable {
    cursor: move;
  }
</style>
<template>
<!-- childKey attribute specifies the children attribute -->
  <div v-if="!node" class="sp-last-component border-light"
  @dragend="dragEnd" @dragover="dragOver" @drop="drop"></div>
  <div v-else-if="node[childKey]" class="card bg-light" :class="{'m-2': parent}" :node="node" :draggable="parent ? true : false"
    @dragend="dragEnd" @dragstart="dragStart" @dragover="dragOver" @drop="drop">
    <div v-if="parent" class="te-draggable px-3 py-2 d-flex align-items-center justify-content-between flex-row" handle="true" @dragover="dragOver">
      <span>{{$i18n(node.label)}}</span>
      <span class="d-flex align-items-center">
        <a href="#" @click.prevent="editNode"><i class="material-icons md-12 text-dark">edit</i></a>
        <a href="#" @click.prevent="deleteNode"><i class="material-icons md-12 text-danger">delete</i></a>
      </span>
    </div>
     <div class="p-2">
      <sp-tree-editor v-for="(container, index) in node[childKey]" :key="container.id" :node="container"
        :parent="node" :pos="index" :child-key="childKey" @edit-node="propagateEditNode" @delete-node="propagateDeleteNode"
      >
      </sp-tree-editor>
      <sp-tree-editor :parent="node" :pos="-1" :child-key="childKey"></sp-tree-editor>
      <!-- <div class="sp-last-component" @dragover="dragOverLast" @drop="drop"></div> -->
    </div>
  </div>
  <div v-else class="te-draggable card d-flex align-items-center justify-content-between flex-row px-3 py-2 m-2" draggable="true"
    @dragstart="dragStart" @dragover="dragOver" @drop="drop" @dragend="dragEnd">
    <span class="d-block"><router-link :to="node.path">{{$i18n(node.label)}}</router-link></span>
    <span class="d-flex align-items-center">
      <a href="#" @click.prevent="editNode"><i class="material-icons md-12 text-dark">edit</i></a>
      <a href="#" @click.prevent="deleteNode"><i class="material-icons md-12 text-danger">delete</i></a>
    </span>
  </div>
</template>
<script>
"use strict";
export default {
  data: function() {
    return { dragged: null, dropped: null };
  },
  props: [
    "node",
    "childKey",
    "parent",
    "pos"
  ],
  methods: {
    drop: function(e) {
      if (!this.parent) {
        this.$emit('save-tree');
      }
      e.preventDefault();
    },
    dragStart: function(e) {
      e.dataTransfer.effectAllowed = "move";
      // Firefox doesn't seem to allow dragging unless you invoke e.dataTransfer.SetData
      e.dataTransfer.setData("text", "dummy");
      if (!this.parent) {
        // This is the root node
        this.dropped = null;
        this.dragged = e.dragged;
        e.stopPropagation();
      } else if (!e.dragged) {
        e.dragged = { target: this.node, parent: this.parent, pos: this.pos };
      }

    },

    dragOver: function(e) {
      e.preventDefault();
      if (!this.parent) {
        // This is the root node
        if (!e.dropped) return;
        if (e.dropped.target === this.dragged.target) return;
        if (
          this.dragged.parent.label == e.dropped.parent.label &&
          this.dragged.pos == e.dropped.pos
        )
          return;
        if (this.dropped === e.dropped) return;

        // For now we don't allow recursive folder structure, this may change in future
        if (this.dragged.target[this.childKey] && this.node !== e.dropped.parent && e.dropped.parent[this.childKey]) return;

        this.dropped = e.dropped;

        // Remove dragged element
        this.dragged.parent[this.childKey].splice(this.dragged.pos, 1);

        var addPos = this.dropped.pos;
        if (!this.dropped.target) {
          this.dropped.parent[this.childKey].push(this.dragged.target);
          this.dragged.pos = this.dropped.parent[this.childKey].length - 1;
        } else {
          // The position of the drop element changes when we remove the dragged element when they both
          // belong to the same parent and the dragged position is less than the dropped position
          if (
            this.dragged.parent === this.dropped.parent &&
            addPos > this.dragged.pos
          ) {
            addPos = addPos - 1;
          }
          this.dropped.parent[this.childKey].splice(
            this.dropped.pos,
            0,
            this.dragged.target
          );
          this.dragged.pos = this.dropped.pos;
          this.dropped.pos = addPos;
       }
        this.dragged.parent = this.dropped.parent;
        e.stopPropagation();
      } else if (!e.dropped) {
        // This check ensures that drop on a folder is recognized only when the element is
        // over the folder header, otherwise it creates inconsistent behavior when the drop
        // is in between two leaves in a folder
        if (this.node && !e.target.getAttribute("handle") && this.node[this.childKey]) {
          e.stopPropagation();
          return;
        }
        e.dropped = { target: this.node, parent: this.parent, pos: this.pos };
      }
    },

    dragEnd: function(e) {
        e.stopPropagation();
        e.preventDefault();
      
    },

    editNode: function(/* ev */) {
      this.$emit("edit-node", this.node);
    },

    deleteNode: function(/* ev */) {
      this.$emit("delete-node", {parent: this.parent, index: this.pos, node: this.node});
    },

    propagateEditNode: function(n) {
      this.$emit('edit-node', n);
    },

    propagateDeleteNode: function(n) {
      this.$emit('delete-node', n);
    }
  }
};
</script>