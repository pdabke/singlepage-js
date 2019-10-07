<template>
<div class="sp-one-column-container">
  <div class="sp-tou">
    <iframe style="width: 100%; height: 100%; display: block; border: none;" :src="$app.config.CDN_URL + '/tou.html'"></iframe>
  </div>
  <div class="text-center">
    <div class="mt-3 mb-3">{{$i18n('msg_accept_tou_lead')}}</div>
    <div><button class="btn btn-primary mb-2" @click.prevent="acceptTou">{{$i18n('msg_accept_tou')}}</button></div>
  </div>
</div>

</template>
<script>
  export default {
    methods: {
      acceptTou: function() {
        this.$app.rpc.invoke("UserService", "handleLoginPrereqsResponse", 
          {login_prereq: 'tou_check', tou_accepted: true }, this.acceptSuccess, null);
      },
      acceptSuccess: function() {
        this.$app.decrementLoginPrereqs(this.$route.path);
      }
    }
  }
</script>