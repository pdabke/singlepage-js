<!--
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 -->

<template>
  <div style="background: transparent;">
<transition name="slide">
    <div v-if="$root.isModalOn" class="sp-sidebar sp-open navbar-dark bg-dark text-light">
      <div v-if="$app.user" class="text-center py-3">
          <div><img v-if="$app.user.avatarURL" :src="$app.user.avatarURL" class="sp-avatar-md rounded-circle"></div>
          <div class="py-2 font-weight-bold">{{$app.user.displayName}}</div>
      </div>
      <div v-else class="p-3"></div>
      <nav class="nav flex-column navbar-nav">
        <template v-for="link in $root.site.siteDef.pages" >
          <div v-if="link.pages" :key="link.path">
            <div :key="link.path" class="mx-4 py-2 border-top border-info">{{$i18n(link.label)}}</div>
            <div :key="link.path" class="px-2">
            <a v-for="link2 in link.pages" :key="link2.path" class="nav-link px-4" href="#"
              @click.prevent="loadPage(link2.path)">{{$i18n(link2.label)}}</a>
            </div>
          </div>
          <a v-else :key="link.path" class="nav-link px-4" href="#"
              @click.prevent="loadPage(link.path)">{{$i18n(link.label)}}</a>
        </template>
        <template v-if="$app.user">
          <div class="mx-4 border-top border-info"></div>
          <a v-for="(link, index) in $root.userLinks" :key="index" class="nav-link px-4" href="#"
            @click.prevent="loadPage(link.path, link.callback)">{{$i18n(link.label)}}</a>
        </template>
        <template v-else-if="$app.config.IS_MULTI_USER">
          <div class="mx-4 border-top border-info"></div>
          <a 
          class="nav-link px-4" href="#" @click.prevent.stop="showLogin">{{$i18n('msg_login')}}</a>
          <a v-if="$app.config.IS_SELF_REGISTRATION_ALLOWED" class="nav-link px-4" href="#" 
          @click.prevent.stop="$app.showRegistrationPage()">{{$i18n('msg_register')}}</a>
        </template>
      </nav>
    </div>
</transition>
<transition name="fade">
    <div v-if="$root.isModalOn" class="modal-backdrop fade show" 
      @click.prevent="hideModal()">
    </div>
</transition>
  </div>
</template>
<script>
export default {
  methods: {
    hideModal() {
      this.$root.isModalOn = false;
    },
    loadPage(path, cb) {
        this.hideModal();
        if (path) {
          this.$router.push('/' + path);
        } else {
          cb();
        }
    },
    showLogin() {
      this.hideModal();
      this.$app.showLoginPage()
    },

    topLevelPages: function(pages) {
      return pages.filter(function(page) {
        return page.isTopLevel;
      });
    }

  }
};
</script>