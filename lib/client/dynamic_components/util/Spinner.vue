<!--
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 -->
<template>
<div :class="containerClass ? containerClass : 'd-flex p-3 justify-content-center'">
  <div :class="spinnerClass ? spinnerClass : 'soup_bowl text-info'" role="status">
    <span class="sr-only">{{$i18n('msg_loading')}}</span>
  </div>
</div>
</template>
<script>
  "use strict";
  import "./spinner.scss";
  export default {
    props: ['containerClass', 'spinnerClass'],
    data: function() {
      return {
        messages: {
          "en-US": {
            "msg_loading": "Loading...",
          },
          "mr": {
            "msg_loading": "लोड करीत आहे..."
          }
        }
      }
    }
  }
</script>