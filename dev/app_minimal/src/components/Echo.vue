<!--
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Use of this source code is governed by MIT license
 * https://opensource.org/licenses/MIT
 * 
 -->
<template>
  <div class="p-4 d-flex justify-content-center flex-column">
    <form>
      <p><input name="input" class="form-control" v-model="msg"
      placeholder="Type words to echo back from EchoService"></p>
      <input type="submit" value="Echo" class="btn btn-primary" @click.prevent.stop="echoMessage">
    </form>
    <div v-html="echo" class="p-3 mt-3 border bg-light d-flex align-items-center justify-content-center"></div>
  </div>
</template>
<script>
export default {
  data: function() { return {echo: '', msg: ''}},
  
  methods: {
    echoMessage: function() {
      this.$app.rpc.invoke("EchoService", "echo", {words: this.msg}, this.echoSuccess, this.echoFail)
    },

    echoSuccess: function(resp) {
      this.echo = '<div class="lead text-success">' + resp + '</div>';
    },

    echoFail: function(errorCode, error) {
      this.echo = '<div class="lead text-danger">' + errorCode + ' : ' + error + '</div>';
    }
  }

}
</script>
