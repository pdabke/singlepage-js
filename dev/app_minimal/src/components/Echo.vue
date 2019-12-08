<!--
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Use of this source code is governed by MIT license
 * https://opensource.org/licenses/MIT
 * 
 -->
<template>
  <div class="p-4 d-flex justify-content-center flex-column">

    <!-- Uncomment this to test Property Def 1 
    <p>Prop A: {{propA}}</p>
    <p>Prop B: {{propB}}</p>
  -->
  
    <!-- Uncomment this to test Property Def 2   

    <p>Title: {{title}}</p>
    <p>Likes: {{likes}}</p>
    <p>isPublished: {{isPublished ? "TRUE" : "FALSE"}}</p>
    <p>Comment ID: {{commentIds ? commentIds[1] : "NULL"}}</p>
    <p>Author: {{author ? author.name : "NULL"}}</p>
      -->
    <!-- Uncomment this to test Property Def 3 
    <p>Prop A: {{propA}}</p>
    <p>Prop B: {{propB}}</p>
    <p>Prop C: {{propC}}</p>
    <p>Prop D: {{propD}}</p>
    <p>Prop E: {{propE.message}}</p>
    <p>Prop F: {{propF}}</p>
    -->

    <form>
      <p><input name="input" class="form-control" v-model="msg" aria-label="Words to echo back from Echo Service"
      placeholder="Type words to echo back from EchoService"></p>
      <input type="submit" value="Echo" class="btn btn-primary" @click.prevent.stop="echoMessage">
    </form>
    <div v-html="echo" class="p-3 mt-3 border bg-light d-flex align-items-center justify-content-center"></div>
  </div>
</template>
<script>
export default {
  /* Property Def 1 
  props: ['propA', 'propB'],
  */

 /* Property Def 2 
  props: {
    title: String,
    likes: Number,
    isPublished: Boolean,
    commentIds: Array,
    author: Object,
    callback: Function,
    contactsPromise: Promise // or any other constructor
  },
*/
  /* Property Def 3 
 props: {
    // Basic type check (`null` and `undefined` values will pass any type validation)
    propA: Number,
    // Multiple possible types
    propB: [String, Number],
    // Required string
    propC: {
      type: String,
      required: true
    },
    // Number with a default value
    propD: {
      type: Number,
      default: 100
    },
    // Object with a default value
    propE: {
      type: Object,
      // Object or array defaults must be returned from
      // a factory function
      default: function () {
        return { message: 'hello' }
      }
    },
    // Custom validator function
    propF: {
      validator: function (value) {
        // The value must match one of these strings
        return ['success', 'warning', 'danger'].indexOf(value) !== -1
      }
    }
  },
*/
  data: function() { 
    return {
      echo: '', 
      msg: '',
      messages: {
        'en-US': {
          'error_must_type_words_to_echo': 'You must type words to echo!'
        }
      }
    }},
  
  methods: {
    echoMessage: function() {
      this.$app.rpc.invoke("EchoService", "echo", {words: this.msg}, this.echoSuccess, this.echoFail)
    },

    echoSuccess: function(resp) {
      this.echo = '<div class="lead text-success">' + resp + '</div>';
    },

    echoFail: function(errorCode, error) {
      this.echo = '<div class="lead text-danger">' + errorCode + ' : ' + this.$i18n(error) + '</div>';
    }
  }

}
</script>
