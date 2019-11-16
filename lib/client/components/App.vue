<!--
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 -->

<template>
  <div :class="{ 'sp-app-with-footer': $root.showApp }">
    <div v-if="$root.showApp" class="navbar navbar-expand-md navbar-light text-primary">
      <div class="container">
        <a href="#/" class="navbar-brand active"><img :src="$root.site.logoURL" alt /></a>
        <button type="button" aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation" class="navbar-toggler">
          <span class="navbar-toggler-icon" @click.prevent="$app.toggleSidebar()"></span>
        </button>
        <div id="navbarResponsive" class="collapse navbar-collapse">
          <!-- You can customize site links by passing ul-class, li-class, and a-class attributes -->
          <sp-site-links :editable="true"></sp-site-links>
        <ul class="nav navbar-nav ml-auto">
          <sp-dropdown v-if="$app.user" class="nav-item" :items="$root.userLinks" align="right" type="list">
            <button class="btn btn-light dropdown-toggle" type="button" id="dropdownMenuButton" aria-haspopup="true" aria-expanded="false">
              <img v-if="$app.user.avatarURL" :src="$app.user.avatarURL" class="sp-avatar-sm sp-menubar-icon rounded-circle bg-dark mr-1">
              {{$app.user.displayName}}
            </button>
          </sp-dropdown>
          <template v-else>
            <li v-if="$app.config.IS_MULTI_USER" class="nav-item">
              <a class="btn btn-primary" href="#" @click.prevent.stop="$app.showLoginPage()">{{$i18n('msg_login')}}</a>
            </li>
            <li v-if="$app.config.IS_SELF_REGISTRATION_ALLOWED" class="nav-item">
              <a class="btn btn-secondary ml-2" href="#" @click.prevent.stop="$app.showRegistrationPage()">{{$i18n('msg_register')}}</a>
            </li>
          </template>
        </ul>
        </div>
      </div>
    </div>
    <transition name="fade" mode="out-in">
      <router-view></router-view>
    </transition>
    <footer class="footer" v-if="$root.showApp">
      <div class="container">
        <div class="row">
          <div class="col-md-6 h-100 text-center text-md-left my-auto small">
            <ul class="list-inline mb-2">
              <li class="list-inline-item">
                <a href="http://www.nabh.com/tou.html">Terms of Use</a>
              </li>
              <li class="list-inline-item">
                <a href="http://www.nabh.com/pp.html">Privacy Policy</a>
              </li>
              <li class="list-inline-item">
                <a href="mailto:info@nabh.com">Contact Us</a>
              </li>
            </ul>
            <p class="mb-4">© 2019 My Company Inc. All Rights Reserved.</p>
          </div>
        </div>
      </div>
    </footer>
    <sp-sidebar></sp-sidebar>
  </div>
</template>
