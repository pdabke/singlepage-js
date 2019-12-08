<template>
<transition :name="$parent.transition">
    <div v-if="selected" :id="computedId" role="tabpanel" :aria-hidden="!selected"
      :aria-labelledby="computedId + '-tab'">
      <slot></slot>
    </div>
</transition>
</template>
<script>
  export default {
    props: {
        id: { default: null },
        title: { required: true },
        disabled:{ default: false }
    },
    data: function() {return {selected: false}},
    computed: {
      computedId: function() { return this.id ? this.id : this.title;}
    }
  }
</script>