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
    data: function() {
      return {
        messages: {
          "en": {
            "msg_agree_to_tou": "By checking this box I agree to abide by the <a href=\"http\"://www.nabh.com/tou.html\">Terms of Use</a>.",
            "msg_must_agree_to_tou": "You must agree to our Terms of Use by checking the box.",
            "msg_accept_tou": "Accept Terms of Use",
            "msg_accept_tou_lead": "Please read the Terms of Use carefully, you may have to scroll to see all of the terms. By clicking the button below, you are accepting the Terms of Use for this Website."

          }
        }
      }
    },
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