/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
"use strict";

const ComponentRegistry = require('../core/component_registry');
const Util = require('../util/util');
const Validator = require('../../common/validator');

var _PAGE_MAP = {};
const _PAGE_STATUS_ACCESS_CHECKED = 1;
const _PAGE_STATUS_EMPTY = 2;
const _PAGE_STATUS_PARTIAL = 3;

const SiteUtil = {
  
    getPageTemplate(name) {
        if (_PAGE_MAP[name]) return _PAGE_MAP[name];

    },

    validateSiteDef(siteDef) {
        var errors = [];
        var ids = {};
        var containerIds = {};
        var pagePaths = {};
        for (let i=0; i<siteDef.pages.length; i++) {
            /* Container IDs need to be unique within the page, so resetting it every page */
            containerIds = {};
            SiteUtil.validatePage(siteDef.pages[i], i, errors, pagePaths, ids, containerIds);
        }
        if (errors.length == 0) return null;
        return errors;
    },

    validatePage(page, index, errors, pagePaths, ids, containerIds) {
        if (!page) {
            errors.push("Null page " + index);
            return;
        }

        if (page.pages) {
          if (!page.label) 
            errors.push("Missing label for folder " + index);
            if (!page.pages) page.pages = [];
            page.pages.forEach(function(p, i) {
              containerIds = {};
              SiteUtil.validatePage(p, page.label + ':' + i, errors, pagePaths, ids, containerIds);
            });
        } else {
          if (!page.label) {
            errors.push("Missing label for page " + index);
          }
          if (!page.path) {
            errors.push("Missing path for page " + index);
          } else if (pagePaths[page.path]) {
              errors.push("Duplicate page path: " + page.path);
          } else if (!page.path.match(/^[a-z0-9]+$/i)) {
              errors.push("Invalid page path: " + page.path);
          } else {
              pagePaths[page.path] = true;
          }
          for (let i=0; i<page.containers.length; i++)
          SiteUtil.validateContainer(page.containers[i], index, errors, ids, containerIds);
        }

        

    },

    validateContainer(container, index, errors, ids, containerIds) {
        if (container.containers && container.containers.length > 0 &&
            container.components && container.components.length > 0) {
                errors.push("Container on page " + index + " has components AND containers.");
                return;
        }

        if (containerIds[container.id]) {
            errors.push("Duplicate container ID: " + container.id);
        } else {
            containerIds[container.id] = true;
        }
        if (container.components) {
            for (let j = 0; j < container.components.length; j++) {
                SiteUtil.validateComponent(container.components[j], index, errors, ids)
            }
        }

        if (container.containers) {
            for (let i = 0; i < container.containers.length; i++) {
                SiteUtil.validateContainer(container.containers[i], index, errors, ids, containerIds);            }
        }

    },

    validateComponent(c, index, errors, ids) {
        if (ids[c.id]) {
            errors.push("Duplicate component ID: " + c.id);
        } else {
            ids[c.id] = true;
        }

        if (!c.name) {
            errors.push("Component name is missing for ID: " + c.id);
        } else if (!ComponentRegistry.isComponentRegistered(c.name)) {
            errors.push("Unregistered component: " + c.name);
        }

        if (c.config && Object.keys(c.config).length > 0) {
            var settings = ComponentRegistry.getComponentSettings(c.name);
            if (!settings) {
              errors.push('Component ' + c.name + ' does not have a settings form configured.');
            } else {
              let configErrors = {};
              let numErrors = Validator.validateForm(settings, c.config, configErrors);
              if (numErrors > 0) errors.push('Invalid configuration for component ID ' + c.id + ' : ' + JSON.stringify(configErrors));
            }
        }
    },

    async getSiteInfo(rawSiteInfo, clientInfo, user, roles) {
      if (rawSiteInfo.accessType != 'PUBLIC' && !user) return null;
      if (rawSiteInfo.accessType == 'PRIVATE' && roles.length == 0) return null;
      if (roles.includes('SUPERADMIN') || roles.includes('ADMIN')) {
        let adminSiteInfo = Util.shallowCopy(rawSiteInfo);
        return adminSiteInfo;
      }
      var siteInfo = Util.partialCopy(rawSiteInfo, ['tenantId', 'id', 'loginUrl', 'logoURL', 'siteURL', 'siteData'])
      var newSiteDef = computeSiteDef(rawSiteInfo, user, roles);
      siteInfo.siteDef = newSiteDef;
      return siteInfo;
    }
  
}

function computeSiteDef(rawSiteInfo, user, user_roles) {
  var siteDef = rawSiteInfo.siteDef;
  if (!siteDef.pages || siteDef.pages.length == 0 || siteDef.accessChecked) return siteDef;
  var roles = {};
  if (user) {
    roles['MEMBER'] = true;
    var len = user_roles.length;
    for (let i=0; i<len; i++) {
      roles[user_roles[i]] = true;
    }
  } else {
    roles['GUEST'] = true;
  }

  return getViewableDef(siteDef, roles);
}
  
function getViewableDef(folder, roles) {
  // accessChecked attribute means that there are no special access control
  // rules on the folder so the folder can be returned as is without having
  // to go through creation of custom view for each user
  if (folder.accessChecked) return folder;
  var pages = [];
  var plen = folder.pages.length;
  var siteAccessChecked = true;
  for (let pi=0; pi<plen; pi++) {
    var page = folder.pages[pi];
    if (page.accessChecked) {
      pages.push(page);
      continue;
    }
    if (!checkAccess(page.roles, roles)) {
      siteAccessChecked = false;
      continue;
    }
    var newPage = null;
    var pageStatus = null;
    if (page.pages) {
      // This is a folder
      newPage = getViewableDef(page, roles);
      if (!newPage) pageStatus = _PAGE_STATUS_EMPTY;
      else if (newPage.accessChecked) pageStatus = _PAGE_STATUS_ACCESS_CHECKED;
      else pageStatus = _PAGE_STATUS_PARTIAL;
    } else {
      newPage = Util.partialCopyNeg(page, ['containers', 'components']);
      pageStatus = constructViewablePage(page, roles, newPage);
    }
    if (pageStatus !== _PAGE_STATUS_ACCESS_CHECKED) siteAccessChecked = false;
    if (pageStatus === _PAGE_STATUS_EMPTY) continue;
    pages.push(newPage);
    if (pageStatus === _PAGE_STATUS_ACCESS_CHECKED ) page.accessChecked = true;
  }
  if (siteAccessChecked) {
    folder.accessChecked = true;
    return folder;
  } else if (pages.length == 0) {
    return null;
  }
  var viewableFolder = Util.partialCopyNeg(folder, ['pages']);
  viewableFolder.pages = pages;
  return viewableFolder;

}
function checkAccess(allowedRoles, roles) {
    if (!allowedRoles || allowedRoles.length == 0) return true;
    if (!roles) return false;
    var len = allowedRoles.length;
    for (let i=0; i<len; i++) {
      if (roles[allowedRoles[i]]) return true;
    }
    return false;
}
  
function constructViewablePage(page, roles, newPage) {
    var foundViewCondition = false;
    var vcomps = [];
    if (page.components) {
      for (let i=0; i<page.components.length; i++) {
        if (page.components[i].roles && page.components[i].roles.length > 0) foundViewCondition = true;
        if (checkAccess(page.components[i].roles, roles)) vcomps.push(page.components[i]);
      }
    }
    if (vcomps.length > 0) {
      newPage.components = vcomps;
    }
  
    let vcontainers = [];
    if (page.containers) {
      for (let i=0; i<page.containers.length; i++) {
        let cont = Util.partialCopyNeg(page.containers[i], ['containers', 'components']);
  
        if (page.containers[i].roles) {
          foundViewCondition = true;
          if (!checkAccess(page.containers[i].roles, roles)) continue;
        }
        let cstatus = constructViewablePage(page.containers[i], roles, cont);
        if (cstatus == _PAGE_STATUS_EMPTY) {
          foundViewCondition = true;
          continue;
        }
  
        vcontainers.push(cont);
        if (cstatus == _PAGE_STATUS_PARTIAL) foundViewCondition = true;
      }
    }
  
    if (vcontainers.length > 0) {
      newPage.containers = vcontainers;
    }
  
    if (vcomps.length == 0 && vcontainers.length == 0) return _PAGE_STATUS_EMPTY;
    if (foundViewCondition) return _PAGE_STATUS_PARTIAL;
    return _PAGE_STATUS_ACCESS_CHECKED;
}

module.exports = SiteUtil;