/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
"use strict";
import Vue from 'vue';
import VueRouter from 'vue-router';
import Constants from '../../common/constants';
import Config from '../../common/config';
import CommonUtils from '../../common/common_util';
import RPC from './rpc';
import I18N from './i18n';
import Modal from './modal_desktop';
import Util from './client_util';
import ComponentTemplates from './component_templates';
import * as SPComponents from './components'

var _INITIALIZED = false;
var _APP_COMPONENT = null;
var _PAGE_NOT_FOUND_COMPONENT = null;
var _PAGE_COMPONENT = null;
var _PAGE_MAP = {};
var _LOGIN_PREREQS = {};
var _SYSTEM_PATHS = ['account_settings', 'page_editor', 'site_metadata_editor', 'site_template_saver', 'page_manager'];
var _SYSTEM_COMPONENTS = ['AccountSettings', 'PageEditor', 'SiteMetadataEditor', 'SiteTemplateSaver', 'PageManager'];
var _SYSTEM_PATHS_ACCESS = ['MEMBER', 'SUPERADMIN', 'ADMIN', 'SUPERADMIN', 'SUPERADMIN'];
var _DYNAMIC_SYSTEM_COMPONENTS = ['Login', 'Logout', 'TreeEditor', 'Spinner', 'Dropdown', 'Tabs', 'TabPane'];

var SPApp = {
  components: SPComponents,
  vue: null,
  router: null,
  constants: Constants,
  config: Config,
  rpc: RPC,
  modal: Modal,
  componentTemplates: ComponentTemplates,
  i18n: I18N,
  util: Util,
  portalEditor: null,
  validator: null,
  componentActions: {},
  outbox: [],
  loadedScripts: {},
  lastLocation: null,
  siteURL: null,
  loginURL: null,
  registerURL: null,
  logoutURL: null,
  user: null,
  site: null,

  init: function (env, msgs, cTemplates, appComp, notFoundComp) {
    if (env) Object.assign(SPApp.config, env);
    SPApp.locale = SPApp.config.LOCALE ? SPApp.config.LOCALE : 'en-US';
    if (SPApp.locale.indexOf('-') != -1) SPApp.localeRoot = SPApp.locale.substring(0, SPApp.locale.indexOf('-'));
    else SPApp.localeRoot = SPApp.locale;
    SPApp.i18n.locale = SPApp.locale;
    SPApp.i18n.appMessages = msgs ? msgs : {};
    SPApp.siteURL = SPApp.util.computeSiteURL();
    SPApp.loginURL = SPApp.siteURL + '/login.html?return_to=' + encodeURIComponent(SPApp.siteURL);
    SPApp.logoutURL = SPApp.siteURL + '/logout.html';
    SPApp.registerURL = SPApp.siteURL + '/login.html?mode=register&return_to=' + encodeURIComponent(SPApp.siteURL);
    SPApp.modal.init();
    SPApp.componentTemplates.init(cTemplates);
    _PAGE_COMPONENT = SPComponents['SpPage'];
    _APP_COMPONENT = appComp ? appComp : SPComponents['SpApp'];
    _PAGE_NOT_FOUND_COMPONENT = notFoundComp ? notFoundComp : SPComponents['SpPageNotFound'];
    setupVue(appComp);  
    getAppInfo();
  },

  getPageComponent: function () {
    return _PAGE_COMPONENT;
  },

  setPage: function (name, page) {
    _PAGE_MAP[name] = page;
  },

  getPage: function (name) {
    return _PAGE_MAP[name];
  },

  showLoginPage: function (route) {
    if (route) {
      localStorage.setItem('SP_PRE_LOGIN_URL', window.location.href);
    }
    SPApp.vue.showApp = false;
    SPApp.router.push('/login');
    //window.location.href = SPApp.siteURL + '#/login';
    //window.location.reload(true);

  },

  showRegistrationPage: function () {
    window.location.href = SPApp.registerURL;
  },

  loginRedirect: function (component_id, action_key, dataObject, paramObject, path) {
    if (SPApp.user) {
      var actionState = {};
      actionState.component_id = component_id;
      actionState.data_object = dataObject;
      actionState.param_object = paramObject;
      actionState.action_key = action_key;
      actionState.user_id = SPApp.user.id;
      var actionStateStr = JSON.stringify(actionState);
      localStorage.setItem('LOGIN_STATE_' + SPApp.site.id, actionStateStr);
    }
    SPApp.showLoginPage(path);
  },

  login: function(username, password, rememberMe, errorHandler) {
    SPApp.rpc.invoke(
      "SessionService",
      "login",
      {
        username: username,
        password: password,
        remember_me: rememberMe
      },
      SPApp.loginSuccess,
      errorHandler
    );
    return false;
  },

  loginSuccess: function(/*respObj*/) {
    SPApp.loginPush = true;
    var lastPath = localStorage.getItem('SP_PRE_LOGIN_URL');
    localStorage.removeItem('SP_PRE_LOGIN_URL');
    if (lastPath) {
      window.location.replace(lastPath);
    } else {
      var path ='/#/';
      window.location.href = SPApp.siteURL + path;
    }
    window.location.reload(true);
  },

  logout: function () {
    SPApp.rpc.invoke(
      "SessionService",
      "logout",
      {},
      SPApp.logoutSuccess,
      SPApp.logoutFailure
    );
  },

  logoutSuccess: function () {
    SPApp.user = null;
    SPApp.lastLocation = null;
    SPApp.lastData = null;
    SPApp.lastQuery = null;
    //SPApp.router.push('/logout');
    window.location.href = SPApp.siteURL + '#/logout';
    window.location.reload(true);

  },

  logoutFailure: function () {
    SPApp.modal.showErrorDialog("error_failed_to_logout");
  },

  computeComponentActions(name) {
    if (!SPApp.components[name]) {
      // This is not a built-in component. This method got called because
      // a user provided component was not loaded properly
      console.error('Component ' + name + ' was not loaded successfully. Please check your set up.');
      SPApp.componentActions[name] = null;
    } else {
      let propsForm = CommonUtils.createPropsForm(SPApp.components[name].props);
      if (propsForm) {
        SPApp.componentActions[name] = {settings: propsForm};      
      } else {
        SPApp.componentActions[name] = null;
      }
    }
    return SPApp.componentActions[name];
  },

  loadScript: function (script, callback) {
    if (SPApp.loadedScripts[script] === true) return true;
    var firstTime = false;
    if (!SPApp.loadedScripts[script]) {
      SPApp.loadedScripts[script] = [];
      firstTime = true;
    }
    SPApp.loadedScripts[script].push(callback);
    var scriptName = script;
    if (firstTime) {
      var lkScript = document.createElement('script');
      lkScript.setAttribute('src', script);
      lkScript.setAttribute('async', false);
      lkScript.setAttribute('defer', false);
      lkScript.addEventListener("load", function () {
        let callbacks = SPApp.loadedScripts[scriptName]
        for (let i = 0; i < callbacks.length; i++) try { callbacks[i]() } catch (e) { /* console.error(e) */ }
        SPApp.loadedScripts[scriptName] = true;
      });
      document.head.appendChild(lkScript)
    }
    return false;
  },

  loadStyle: function (css) {
    var head = document.head || document.getElementsByTagName('head')[0],
      style = document.createElement('style');

    style.type = 'text/css';
    if (style.styleSheet) {
      // This is required for IE8 and below.
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }

    head.appendChild(style);
  },

  getPreLoginState: function (componentId) {
    if (SPApp.preLoginState && SPApp.preLoginState.component_id == componentId &&
      SPApp.preLoginState.user_id == SPApp.user.id) {
      localStorage.removeItem('LOGIN_STATE_' + SPApp.site.id);
      let st = SPApp.preLoginState;
      SPApp.preLoginState = null;
      return st;
    }
    return null;
  },

  routeToLastLocation: function () {
    if (SPApp.lastLocation) SPApp.router.push(SPApp.lastLocation);
    else SPApp.router.push('/');
  },

  decrementLoginPrereqs: function (path) {
    path = path.substring(1);
    var index = SPApp.user.loginPrereqs.indexOf(path);
    if (index !== -1) SPApp.user.loginPrereqs.splice(index, 1);
    else {
      return;
    }
    if (SPApp.user.loginPrereqs.length == 0) {
      SPApp.vue.loaded = true;
      SPApp.routeToLastLocation();
    } else {
      SPApp.router.push(SPApp.user.loginPrereqs[0]);
    }

  },

  toggleEditMode: function () {
    SPApp.vue.isEditMode = !SPApp.vue.isEditMode;
    // Drag n drop causes a problem with text selection and editing
    // so we turn it off when the edit mode is on
    SPApp.vue.userLinks = SPApp.computeUserLinks();
  },

  loadPageEditor: function () {
    SPApp.router.push({ path: 'page_editor', query: { page: SPApp.vue.currentPage.path } })
  },

  createPageRouteEntries: function (page) {
    var routeEntry = {};
    routeEntry.path = '/' + page.path;
    routeEntry.component = _PAGE_COMPONENT;
    routeEntry.props = { config: page };
    _PAGE_MAP[page.path] = page;
    var entries = [];
    entries.push(routeEntry);
    routeEntry = {};
    routeEntry.path = '/' + page.path + '/:target';
    routeEntry.component = _PAGE_COMPONENT;
    routeEntry.props = function (route) {
      return { target: route.params.target, config: page }
    };
    entries.push(routeEntry);
    return entries;
  },

  createPage: function (pageSettings, dontGoToPage) {
    SPApp.portalEditor.createPage(pageSettings, SPApp.site.siteDef, SPApp.adminData.pageLayouts.layoutMap, SPApp.router, dontGoToPage, SPApp);
  },

  editPage: function (pageName, newConfig, dontGoToPage) {
    SPApp.portalEditor.editPage(_PAGE_MAP[pageName], newConfig, SPApp.site.siteDef, SPApp.adminData.pageLayouts.layoutMap, SPApp.router, dontGoToPage, SPApp)
  },

  deletePage: function (page) {
    SPApp.portalEditor.deletePage(page, SPApp.site.siteDef, SPApp.router, SPApp);
  },

  deleteCurrentPage: function () {
    if (SPApp.vue.currentPage)
      SPApp.modal.showDialog('msg_delete_current_page', 'msg_delete_current_page_confirmation',
        ['msg_delete_page', 'msg_cancel'], delete_current_page_cb);
  },

  computeUserLinks: function () {
    var userLinks = [];
    var link;
    if (SPApp.config.IS_MULTI_USER) {
      link = {};
      link.path = "account_settings";
      link.label = "msg_account_settings";
      userLinks.push(link);
    }

    if (SPApp.user && SPApp.user.isSuperadmin && SPApp.vue.isEditMode) {
      var editLinks = [
        { path: 'page_editor', label: 'msg_new_page' },
        { callback: SPApp.loadPageEditor, label: 'msg_edit_page_metadata' },
        { callback: SPApp.deleteCurrentPage, label: 'msg_delete_current_page' },
        { path: 'page_manager', label: 'msg_page_manager' },
        {path: 'site_metadata_editor', label: 'msg_edit_site_metadata'}
      ];
      if (SPApp.config.IS_MULTI_SITE) {
        editLinks.push(
          { path: 'site_metadata_editor', label: 'msg_edit_site_metadata' }
        );
      }
      userLinks = userLinks.concat(editLinks);

    }

    if (SPApp.user && SPApp.user.isAdmin) {
      if (SPApp.vue.isEditMode) {
        userLinks.push({ callback: SPApp.toggleEditMode, label: 'msg_turn_off_edit_mode' })
      } else {
        userLinks.push({ callback: SPApp.toggleEditMode, label: 'msg_turn_on_edit_mode' })
      }
    }

    if (SPApp.user) {
      userLinks.push({ callback: SPApp.logout, label: 'msg_logout' })
    } else if (SPApp.config.IS_MULTI_USER) {
      userLinks.push({ callback: SPApp.showLoginPage, label: 'msg_login' });
      if (SPApp.config.IS_SELF_REGISTRATION_ALLOWED) {
        userLinks.push({ callback: SPApp.showRegistrationPage, label: 'msg_register' });
      }
    }
    return userLinks;
  },
  toggleSidebar: function() {
    SPApp.vue.isModalOn = !SPApp.vue.isModalOn;
  },

}

function delete_current_page_cb(index) {
  if (index == 0) SPApp.portalEditor.deletePage(SPApp.vue.currentPage, SPApp.site.siteDef, SPApp.router, SPApp);
}

/* getAppInfo is a separate function even though it is a one liner is because user gets to retry
   retrieving appInfo if the first call fails.
*/
function getAppInfo() {
  SPApp.rpc.invoke("AppService", "getAppInfo", {}, appInfoSuccess, appInfoError);
}

function appInfoSuccess(respObj) {
  if (!respObj) {
    SPApp.modal.showErrorDialog(SPApp.i18n.localize('error_internal'));
    return;
  }

  if (!_INITIALIZED) {
    if (respObj.watch) {
      console.log('Application running in development mode.');
      SPApp.loadScript(window.location.protocol + "//" + window.location.hostname + ":" + respObj.watch.port + "/livereload.js?snipver=1");
    }
  }
  SPApp.adminData = respObj.adminData;
  SPApp.appComponents = respObj.appComponents;
  var cMap = {};
  SPApp.appComponents.forEach(function(comp) {
    cMap[comp[0]] = comp;
  });
  SPApp.componentMap = cMap;

  if (!respObj.site && !respObj.user) {
    SPApp.showLoginPage();
    return;
  }
  SPApp.site = respObj.site;
  if (!SPApp.site.logoURL) SPApp.site.logoURL = SPApp.config.CDN_URL + '/images/app_logo.png';
  mixinOverrides();

  SPApp.user = respObj.user;
  if (SPApp.user) {
    if (!SPApp.user.avatarURL) SPApp.user.avatarURL = SPApp.config.CDN_URL + '/images/avatar.png';
  }
  if (SPApp.user && SPApp.user.roles) {
    if (SPApp.user.roles.includes('ADMIN') || SPApp.user.roles.includes('SUPERADMIN')) SPApp.user.isAdmin = true;
    if (SPApp.user.roles.includes('SUPERADMIN')) SPApp.user.isSuperadmin = true;
  }
  let loaded = !SPApp.user || !SPApp.user.loginPrereqs || SPApp.user.loginPrereqs.length === 0;
  if (SPApp.config.LOGIN_PREREQS) {
    for (let i = 0; i < SPApp.config.LOGIN_PREREQS.length; i++) {
      _LOGIN_PREREQS[SPApp.config.LOGIN_PREREQS[i]] = true;
      _SYSTEM_PATHS.push(SPApp.config.LOGIN_PREREQS[i]);
    }
  }
  SPApp.preLoginState = localStorage.getItem('LOGIN_STATE_' + SPApp.site.id);
  if (SPApp.preLoginState) SPApp.preLoginState = JSON.parse(SPApp.preLoginState);
  initVue(loaded);
  SPApp.loadScript(SPApp.config.CDN_URL + '/lib/validator.umd.js', 
  function() { SPApp.validator = SPValidator; });

  if (SPApp.user && SPApp.user.isSuperadmin) {
    SPApp.loadScript(SPApp.config.CDN_URL + '/lib/portal_editor.umd.js', 
      function() { 
        SPPortalEditor.SPRPC = SPApp.rpc; 
        SPPortalEditor.SPModal = SPApp.modal; 
        SPApp.portalEditor = SPPortalEditor; });
  }
  _INITIALIZED = true;
  // if (SPApp.config.is_mobile) init_nav(SPModal.sidebar, respObj.email);
  if (!SPApp.user) {
    // Note the additional check for an entry in _PAGE_MAP. It seems that paths
    // pointing to async components (e.g. logout) don't find a matching component
    if ((SPApp.router.getMatchedComponents().length == 0 || 
        SPApp.router.getMatchedComponents()[0] == _PAGE_NOT_FOUND_COMPONENT) &&
        !_PAGE_MAP[SPApp.router.currentRoute.path.substring(1)]) {
      localStorage.setItem('SP_PRE_LOGIN_URL', window.location.href);
      SPApp.vue.showApp = false;
      SPApp.router.push('/login');
    } else {
      localStorage.removeItem('SP_PRE_LOGIN_URL');
    }
  } else if (SPApp.user) {
    if (SPApp.user.loginPrereqs && SPApp.user.loginPrereqs.length > 0) {
      SPApp.router.push('/' + SPApp.user.loginPrereqs[0]);
    } else {
      if (SPApp.router.getMatchedComponents().length == 0) {
        // If it comes here, it does not necessarily mean there is no
        // matching component. This happens for asynch components
        let cpath = SPApp.router.currentRoute.path.substring(1);
        if (!_PAGE_MAP[cpath]) SPApp.router.push('/page_not_found');
        else if (_SYSTEM_PATHS.includes(cpath) && cpath != 'account_settings' 
          && SPApp.user.isSuperadmin) SPApp.toggleEditMode();
      }
    }
  }
    
  setCurrentPage(SPApp.router.currentRoute.path);
  
}

function appInfoError(status, errorMsg, /*result */) {
  SPApp.modal.showErrorDialog(errorMsg, ['msg_retry'], getAppInfo);
  return;
}


function initVue(isLoaded) {
  let siteInfo = SPApp.site;
  if (!_INITIALIZED) {
    registerComponents();
    createVueObjects();
    if (siteInfo.siteDef.style) SPApp.loadStyle(siteInfo.siteDef.style);
  }
  SPApp.vue.loaded = isLoaded;
  SPApp.vue.site = siteInfo;
  SPApp.vue.userLinks = SPApp.computeUserLinks();
  setupRoutes(siteInfo.siteDef);

  if (!_INITIALIZED) SPApp.vue.$mount('#app');
}

function setCurrentPage(rawPath) {
  let path = rawPath.substring(1);
  let slash = path.indexOf('/');
  if (slash > 0) path = path.substring(0, slash);
  SPApp.vue.currentPage = _PAGE_MAP[path];

}
function getPageList(pageOrFolder, pages) {
  if (pageOrFolder.pages) {
    if (pageOrFolder.containers && pageOrFolder.containers.length > 0) pages.push(pageOrFolder);
    pageOrFolder.pages.forEach(function (p, /*index*/) {
      getPageList(p, pages);
    });
  } else {
    pages.push(pageOrFolder);
  }
}
function setupRoutes(siteDef) {
  var rr = [];
  var pages = [];
  getPageList(siteDef, pages);
  for (let i = 0; i < pages.length; i++) {
    rr = rr.concat(SPApp.createPageRouteEntries(pages[i]));
  }
  if (rr.length > 0) {
    var firstEntry = rr[0];
    SPApp.vue.currentPage = pages[0];
    rr.push({ path: '/', redirect: firstEntry.path });
  }
  rr.push({path: '/page_not_found', component: _PAGE_NOT_FOUND_COMPONENT});
  _PAGE_MAP['page_not_found'] = {path: '/page_not_found', component: _PAGE_NOT_FOUND_COMPONENT};
  // We handle navigation to unknown paths in the beforeEach router handler
  // Registering page not found component to * has a slightly undesirable
  // effect of showing up for a brief second when an unlogged user navigates to a page that is
  // accessible after login
  //rr.push({path: '*', component: _PAGE_NOT_FOUND_COMPONENT});

  // System paths
  for (let i = 0; i < _SYSTEM_PATHS.length; i++) {
    if (_SYSTEM_PATHS_ACCESS[i] == 'ADMIN' && (!SPApp.user || !SPApp.user.isAdmin)) continue;
    if (_SYSTEM_PATHS_ACCESS[i] == 'SUPERADMIN' && (!SPApp.user || !SPApp.user.isSuperadmin)) continue;
    if (_SYSTEM_PATHS_ACCESS[i] != null && !SPApp.user) continue;

    let pageEntry = {
      path: '/' + _SYSTEM_PATHS[i],
      component: SPApp.components[_SYSTEM_COMPONENTS[i]] ? SPApp.components[_SYSTEM_COMPONENTS[i]] : 
      componentLoadFunction('Sp' + _SYSTEM_COMPONENTS[i], '/spcomponents/' + _SYSTEM_COMPONENTS[i] + '.js'),
      props: true
    };
    rr.push(pageEntry);
    _PAGE_MAP[_SYSTEM_PATHS[i]] = pageEntry;
  }

  // Login/Logout components
  for (let i = 0; i < 2; i++) {
    let pageEntry = {
      path: '/' + _DYNAMIC_SYSTEM_COMPONENTS[i].toLowerCase(),
      component:
        componentLoadFunction('Sp' + _DYNAMIC_SYSTEM_COMPONENTS[i], '/spcomponents/' + _DYNAMIC_SYSTEM_COMPONENTS[i] + '.js'),
      props: true
    };
    rr.push(pageEntry);
    _PAGE_MAP[_DYNAMIC_SYSTEM_COMPONENTS[i].toLowerCase()] = pageEntry;
  }


  if (_INITIALIZED) {
    var newRouter = new VueRouter({
      routes: rr,
      linkActiveClass: 'active'
    });
    // newRouter.onReady(function() { SPApp.router.matcher = newRouter.matcher;});
    SPApp.router.matcher = newRouter.matcher;
    //SPApp.vue.router = newRouter;
  } else {
    SPApp.router.addRoutes(rr);
  }

  if (!_INITIALIZED) {
    SPApp.router.afterEach(function (to, from) {
      setCurrentPage(to.path);
    });

    SPApp.router.beforeEach(function (to, from, next) {
      var basePath = to.path.substring(1);
      if (basePath == 'login' || basePath == 'logout') {
        SPApp.vue.showApp = false;
        next();
        return;
      } else SPApp.vue.showApp = true;
      // Strip the base page path in case of a target specified after slash
      if (basePath.indexOf('/') > 0) basePath = basePath.substring(0, basePath.indexOf('/'));
      if (_PAGE_MAP[basePath]) {
        if (_LOGIN_PREREQS[basePath]) {
          if (SPApp.user && SPApp.user.loginPrereqs && SPApp.user.loginPrereqs[0] == basePath) {
            //document.getElementById('app').className = 'sp-page-' + to.path.substring(1);
            document.body.className = 'sp-page-' + to.path.substring(1);
            next();
          } else {
            next({ path: '/' });
          }
        } else {
          if (SPApp.user && SPApp.user.loginPrereqs && SPApp.user.loginPrereqs.length > 0) {
            SPApp.lastLocation = to.path;
            next({ path: SPApp.user.loginPrereqs[0] });
          } else {
            // document.getElementById('app').className = 'sp-page-' + basePath;
            document.body.className = 'sp-page-' + basePath;
            next();
          }

        }
      } else if (SPApp.user) {
        next({ path: '/page_not_found' });
      } else {
        if (SPApp.loginPush) {
          SPApp.loginPush = false;
          next();
        } else SPApp.showLoginPage(to);
      }
    });
  }
}

function mixinOverrides() {
  // Merge site config and component config using overrides in site_data
  if (SPApp.site.siteData && SPApp.site.siteData.componentConfig) {
    var overrides = SPApp.site.siteData.componentConfig;
    var pages = SPApp.site.siteDef.pages;
    var plen = pages.length;
    for (let pi = 0; pi < plen; pi++) {
      mixinOverridesHelper(pages[pi], overrides);
    }
  }
}

function mixinOverridesHelper(container, overrides) {
  if (container.components) {
    for (let i = 0; i < container.components.length; i++) {
      let id = container.components[i].id;
      let configOverride = overrides['sp_' + id];
      if (!configOverride) continue;
      if (container.components[i].config) {
        SPApp.util.mixin(container.components[i].config, configOverride)
      } else {
        container.components[i].config = configOverride;
      }
    }
  }

  if (container.containers) {
    for (let i = 0; i < container.containers.length; i++) {
      mixinOverridesHelper(container.containers[i], overrides);
    }
  }
}

function setupVue(appComp) {
  Vue.config.productionTip = false;
  Vue.prototype.$app = SPApp;
  Vue.prototype.$i18n = function (key, values) {
    var messages = null;
    if (this.$data && this.$data.messages) {
      if (this.$data.messages[this.$app.locale]) messages = this.$data.messages[this.$app.locale];
      else if (this.$data.messages[this.$app.localeRoot]) messages = this.$data.messages[this.$app.localeRoot];
      else if (this.$data.messages['en']) messages = this.$data.messages['en'];
      else if (this.$data.messages['en-US']) messages = this.$data.messages['en-US'];
    } else if (this.$props && this.$props.messages) {
      if (this.$props.messages[this.$app.locale]) messages = this.$props.messages[this.$app.locale];
      else if (this.$props.messages[this.$app.localeRoot]) messages = this.$props.messages[this.$app.localeRoot];
      else if (this.$props.messages['en']) messages = this.$props.messages['en'];
      else if (this.$props.messages['en-US']) messages = this.$props.messages['en-US'];
    }
    return this.$app.i18n.localize(key, messages, values)
  };

  if (appComp) Vue.component('sp-app-main', appComp);
}

function registerComponents() {
  for (const name in SPComponents) {
    Vue.component(name, SPComponents[name]);
  }
  SPApp.components = SPComponents;
  // Register components that can be added by the admin to the site
  // Note that some of these SP provided components will be pre-loaded, most
  // will need to be loaded dynamically
  for (let ii=0; ii<SPApp.appComponents.length; ii++) {
    let compRec = SPApp.appComponents[ii];
    if (!compRec[2]) {
      // This would be so easy if MS Edge supported dynamic imports
      //Vue.component(compRec[0], () => import(SPApp.config.CDN_URL + compRec[1]));
      loadComponent(compRec);
    }
  }
  // Load SP components that need dynamic loading
  for (let ii=0; ii<_DYNAMIC_SYSTEM_COMPONENTS.length; ii++) {
    let name = 'Sp' + _DYNAMIC_SYSTEM_COMPONENTS[ii];
    let loadPath = '/spcomponents/' + _DYNAMIC_SYSTEM_COMPONENTS[ii] + '.js';
    Vue.component(name, componentLoadFunction(name, loadPath));
  }
}

function createVueObjects() {
  SPApp.router = new VueRouter({
    routes: [],
    linkActiveClass: 'active'
  });
  Vue.use(VueRouter);

  SPApp.vue = new Vue({
    router: SPApp.router,
    render: h => h(_APP_COMPONENT),
    data: {
      loaded: false,
      isEditMode: false,
      site: null,
      currentPage: null,
      isModalOn: false,
      userLinks: [],
      showApp: !(window.location.hash.startsWith('#/login') || window.location.hash.startsWith('#/logout'))
    }
  });
}

function loadComponent(compRec) {
  let name = compRec[0];
  let loadPath = compRec[1];
  Vue.component(name, componentLoadFunction(name, loadPath)
  );
}

function componentLoadFunction(name, loadPath) {
  return function (resolve, reject) {
    if (window[name]) return window[name];
    const script = document.createElement('script');
    script.async = true;
    script.addEventListener('load', function() {
      let comp = window[name];
      // if (comp.js) comp = comp.js;
      let propsForm = CommonUtils.createPropsForm(comp.props);
      if (propsForm) {
        SPApp.componentActions[name] = {settings: propsForm};      
      } else {
        SPApp.componentActions[name] = null;
      }
      resolve(comp);
    });
    script.addEventListener('error', function() {
      reject(new Error('Error loading component ' + name));
    });
    script.src = loadPath.startsWith('http') ? loadPath : SPApp.config.CDN_URL + loadPath;
    document.head.appendChild(script);
  }
}
export default SPApp;
export { I18N, RPC, SPComponents };

