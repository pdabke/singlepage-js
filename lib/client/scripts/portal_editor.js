/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
"use strict";
//import SPRPC from './rpc';
//import SPModal from './modal_desktop';

var SPPortalEditor_el;
var SPPortalEditor_el_parent;
var SPPortalEditor_el_sibling;

var SPPortalEditor = {
  SPModal: null,
  SPRPC: null,
  deleteComponent: function (id, page, siteDef) {
    sp_remove_component_helper(id, page);
    sp_save_site_def(siteDef);
  },

  addComponent: function (name, compArray, siteDef) {
    var comp = {};
    comp.id = sp_find_next_id(siteDef) + 1;
    comp.name = name;
    comp.config = {};
    comp.roles = [];
    compArray.push(comp);
    sp_save_site_def(siteDef);
  },

  createPage: function (pageSettings, siteDef, layoutMap, router, dontGoToPage, app) {
    var page = {};
    page.path = pageSettings.path;
    page.label = pageSettings.label;
    page.layout = pageSettings.layout;
    page.roles = pageSettings.roles;
    page.isTopLevel = pageSettings.isTopLevel;
    page.folder = pageSettings.folder;
    page.components = [];
    // Deep copy layout object
    var c = JSON.stringify(layoutMap[page.layout]);
    page.containers = JSON.parse(c);
    siteDef.pages.push(page);
    sp_save_site_def(siteDef);
    var routeEntries = app.createPageRouteEntries(page);
    router.addRoutes(routeEntries);
    if (dontGoToPage)
      sp_save_site_def(siteDef);
    else
      sp_save_site_def(siteDef, function () { router.push(routeEntries[0].path); });

  },

  editPage: function (pageConfig, newConfig, siteDef, layoutMap, router, dontGoToPage, app) {
    pageConfig.isTopLevel = newConfig.isTopLevel;
    pageConfig.label = newConfig.label;
    pageConfig.roles = newConfig.roles;
    pageConfig.folder = newConfig.folder;
    if (pageConfig.layout != newConfig.layout) {
      var c = JSON.stringify(layoutMap[newConfig.layout]);
      var newContainers = JSON.parse(c);
      var cold = sp_get_component_containers(pageConfig.containers);
      var cnew = sp_get_component_containers(newContainers);

      if (cold.length <= cnew.length) {
        for (let i = 0; i < cold.length; i++) {
          cnew[i].components = cold[i].components
        }
      } else {
        for (let i = 0; i < cnew.length; i++) {
          cnew[i].components = cold[i].components
          if (!cnew[i].components) cnew[i].components = [];
        }
        var current = 0;
        for (let i = cnew.length; i < cold.length; i++) {
          let comps = cold[i].components
          if (!comps) continue;
          for (let j = 0; j < comps.length; j++) {
            cnew[current].components.push(comps[j]);
            current++;
            if (current >= cnew.length) current = 0;
          }
        }

      }
      pageConfig.containers = newContainers;
      pageConfig.layout = newConfig.layout;
    }

    if (pageConfig.path != newConfig.path) {
      pageConfig.path = newConfig.path;
      var routeEntry = app.createPageRouteEntries(pageConfig);
      router.addRoutes(routeEntry);
      // pageName = pageConfig.path;
    }

    if (dontGoToPage)
      sp_save_site_def(siteDef);
    else
      sp_save_site_def(siteDef, function () { router.push('/' + pageConfig.path); });
  },

  deletePage: function (page, siteDef, router, app) {
    for (let i = 0; i < siteDef.pages.length; i++) {
      if (siteDef.pages[i] === page) {
        siteDef.pages.splice(i, 1);
        // _PAGE_MAP[page.path] = undefined;
        app.setPage(page.path, undefined);
        router.push('/');
        sp_save_site_def(siteDef, function () { router.push('/'); });
        break;
      }
    }
  },

  dragOver: function (e, page) {
    e.preventDefault();
    if (SPPortalEditor_el === e.target) return;
    if (e.target.id && e.target.id.startsWith('comp-')) {
      if (isBefore(SPPortalEditor_el, e.target))
        insertBefore(SPPortalEditor_el, e.target, null, page);
      else
        insertBefore(SPPortalEditor_el, next_sibling_component(e.target), e.target, page);
    } else if (e.target.parentNode && e.target.parentNode.id && e.target.parentNode.id.startsWith('comp-')) {
      if (isBefore(SPPortalEditor_el, e.target.parentNode))
        insertBefore(SPPortalEditor_el, e.target.parentNode, null, page);
      else
        insertBefore(SPPortalEditor_el, next_sibling_component(e.target.parentNode), e.target.parentNode, page);
    } else if (e.target.id && e.target.id.startsWith('comp--')) {
      let cid = e.target.parentNode.id;
      cid = cid.substring(cid.indexOf('-') + 1);
      let container = sp_find_empty_container(cid, page);
      let comp = sp_remove_component(SPPortalEditor_el.id, page);
      if (!container.components) container.components = [];
      container.components.push(comp);
    } else if (e.target.parentNode && e.target.parentNode.id && e.target.parentNode.id.startsWith('comp--')) {
      let cid = e.target.parentNode.parentNode.id;
      cid = cid.substring(cid.indexOf('-') + 1);
      let container = sp_find_empty_container(cid, page);
      let comp = sp_remove_component(SPPortalEditor_el.id, page);
      if (!container.components) container.components = [];
      container.components.push(comp);
    }

  },

  dragEnd: function (siteDef) {
    if (SPPortalEditor_el_sibling) {
      if (SPPortalEditor_el_sibling !== SPPortalEditor_el.nextSibling) sp_save_site_def(siteDef);
    } else if (SPPortalEditor_el.nextSibling || SPPortalEditor_el_parent !== SPPortalEditor_el.parentNode) sp_save_site_def(siteDef);
    SPPortalEditor_el = null;
    SPPortalEditor_el_parent = null;
    SPPortalEditor_el_sibling = null;
  },

  dragStart: function (e) {
    if (e.target.id && e.target.id.startsWith('comp-')) {
      if (e.target.id.startsWith('comp--')) return;
      e.dataTransfer.effectAllowed = "move";
      // D&D does not work on Firefox unless we call setData on DataTransfer
      // otherwise the following call is useless
      e.dataTransfer.setData("text", "random")
      SPPortalEditor_el = e.target;
      SPPortalEditor_el_parent = SPPortalEditor_el.parentNode;
      SPPortalEditor_el_sibling = SPPortalEditor_el.nextSibling;
    }
  },

  pageDragStart: function (e) {
    console.log('start')
    if (e.target.id && e.target.id.startsWith('page-')) {
      console.log('start1')
      e.dataTransfer.effectAllowed = "move";
      // D&D does not work on Firefox unless we call setData on DataTransfer
      // otherwise the following call is useless
      e.dataTransfer.setData("text", "random")
      SPPortalEditor_el = e.target;
      SPPortalEditor_el_parent = SPPortalEditor_el.parentNode;
      SPPortalEditor_el_sibling = SPPortalEditor_el.nextSibling;
    }
  },

  pageDragEnd: function (siteDef) {
    if (SPPortalEditor_el_sibling) {
      if (SPPortalEditor_el_sibling !== SPPortalEditor_el.nextSibling) sp_save_site_def(siteDef);
    } else if (!SPPortalEditor_el.nextSibling) sp_save_site_def(siteDef);
    SPPortalEditor_el = null;
    SPPortalEditor_el_parent = null;
    SPPortalEditor_el_sibling = null;
  },

  pageDragOver: function (e, siteDef) {
    if (e.target.id && e.target.id.startsWith('page-')) {
      if (isBefore(SPPortalEditor_el, e.target))
        sp_insert_page(SPPortalEditor_el, e.target, siteDef);
      else
        sp_insert_page(SPPortalEditor_el, sp_next_page(e.target), e.target, siteDef);
    } else if (e.target.parentNode && e.target.parentNode.id && e.target.parentNode.id.startsWith('page-')) {
      if (isBefore(SPPortalEditor_el, e.target.parentNode))
        sp_insert_page(SPPortalEditor_el, e.target.parentNode, siteDef);
      else
        sp_insert_page(SPPortalEditor_el, sp_next_page(e.target.parentNode), e.target.parentNode, siteDef);
    }
  }
}

function isBefore(el1, el2) {
  if (el2.parentNode === el1.parentNode)
    for (let cur = el1.previousSibling; cur; cur = cur.previousSibling)
      if (cur === el2)
        return true;
  return false;
}

function insertBefore(src, tgt, origTgt, page) {
  //id1 = id1.substring(id1.indexOf("-") + 1);
  //id2 = id2.substring(id2.indexOf("-") + 1);
  if (!tgt) tgt = origTgt;
  if (src.id == tgt.id) return;
  var comp = sp_remove_component(src.id, page);
  if (!comp) {
    return;
  }
  if (tgt.id.startsWith('comp--')) {
    var container = sp_find_empty_container(tgt.id.substring(tgt.id.indexOf("-") + 2), page);
    container.components.push(comp);
  } else {
    sp_add_component(tgt.id, comp, page);
  }
}

function sp_add_component(id, page, parent) {
  var d = id.substring(id.indexOf("-") + 1);
  sp_add_component_helper(d, page, parent);

}

function sp_add_component_helper(id, config, page) {
  if (page.components) {
    for (let j = 0; j < page.components.length; j++) {
      if (page.components[j].id == id) {
        page.components.splice(j, 0, config)[0];
        return true;
      }
    }
  }

  if (page.containers) {
    for (let i = 0; i < page.containers.length; i++) {
      var comp = sp_add_component_helper(id, config, page.containers[i]);
      if (comp) return comp;
    }
  }
}
function sp_remove_component(id, page) {
  var d = id.substring(id.indexOf("-") + 1);
  return sp_remove_component_helper(d, page);
}

function sp_remove_component_helper(id, page) {
  if (page.components) {
    for (let j = 0; j < page.components.length; j++) {
      if (page.components[j].id == id) {
        let comp = page.components.splice(j, 1)[0];
        // page.components = page.components;
        return comp;
      }
    }
  }

  if (page.containers) {
    for (let i = 0; i < page.containers.length; i++) {
      let comp = sp_remove_component_helper(id, page.containers[i]);
      if (comp) return comp;
    }
  }
}

function sp_find_empty_container(id, page) {
  return sp_find_empty_container_helper(id, page);
}

function sp_find_empty_container_helper(id, page) {
  if (page.id == id) return page;
  if (page.containers && page.containers.length > 0) {
    for (let i = 0; i < page.containers.length; i++) {
      var p = sp_find_empty_container_helper(id, page.containers[i]);
      if (p) return p;
    }
  }

}

function sp_get_component_containers(cs) {
  var cc = [];
  for (let i = 0; i < cs.length; i++) {
    sp_get_component_containers_helper(cs[i], cc);
  }
  return cc;
}

function sp_get_component_containers_helper(c, cc) {
  if (c.containers && c.containers.length > 0) {
    for (let i = 0; i < c.containers.length; i++) sp_get_component_containers_helper(c.containers[i], cc);
  } else {
    cc.push(c);
  }
}

function sp_find_next_id(siteDef) {
  var maxId = 0;
  // Create a flat list of pages
  var pages = [];
  flattenPages(siteDef, pages);
  for (let i = 0; i < pages.length; i++) {
    let id = sp_find_max_id(pages[i]);
    if (id > maxId) maxId = id;
  }
  return maxId;
}

function flattenPages(parent, pageA) {
  if (!parent.pages) return;
  for (let ii=0; ii<parent.pages.length; ii++) {
    pageA.push(parent.pages[ii]);
    flattenPages(parent.pages[ii], pageA);
  }
}
function sp_find_max_id(c) {
  var maxId = 0;
  if (c.containers) {
    for (let i = 0; i < c.containers.length; i++) {
      var id = sp_find_max_id(c.containers[i]);
      if (id > maxId) maxId = id;
    }
  }

  if (c.components) {
    for (let i = 0; i < c.components.length; i++) {
      if (c.components[i].id > maxId) maxId = c.components[i].id;
    }
  }
  return maxId;
}

function sp_save_site_def(siteDef, successCB) {
  SPPortalEditor.SPRPC.invoke("SiteService", "saveSiteDef", { "siteDef": siteDef }, successCB, sp_site_save_error);
}

function sp_site_save_error() {
  SPPortalEditor.SPModal.showErrorDialog("error_failed_to_save_site_def");
}

function next_sibling_component(node) {
  if (node.nextSibling && node.nextSibling.id && node.nextSibling.id.startsWith('comp-')) return node.nextSibling;
  if (node.nextSibling && node.nextSibling.nextSibling && node.nextSibling.nextSibling.id &&
    node.nextSibling.nextSibling.id.startsWith('comp-')) return node.nextSibling.nextSibling;
  return null;
}



function sp_next_page(node) {
  if (node.nextSibling && node.nextSibling.id && node.nextSibling.id.startsWith('page-')) return node.nextSibling;
  if (node.nextSibling && node.nextSibling.nextSibling && node.nextSibling.nextSibling.id &&
    node.nextSibling.nextSibling.id.startsWith('page-')) return node.nextSibling.nextSibling;
  return null;
}

function sp_insert_page(src, tgt, origTgt, siteDef) {
  //id1 = id1.substring(id1.indexOf("-") + 1);
  //id2 = id2.substring(id2.indexOf("-") + 1);
  if (!tgt) tgt = origTgt;
  if (src.id == tgt.id) return;
  var path = src.id.substring(5);
  var page = null;
  for (let i = 0; i < siteDef.pages.length; i++) {
    if (siteDef.pages[i].path == path) {
      page = siteDef.pages[i];
      siteDef.pages.splice(i, 1);
      break;
    }
  }

  if (tgt.id == "page--1") {
    siteDef.pages.push(page);
  } else {
    path = tgt.id.substring(5);
    for (let i = 0; i < siteDef.pages.length; i++) {
      if (siteDef.pages[i].path == path) {
        siteDef.pages.splice(i, 0, page);
        break;
      }
    }
  }
}

export default SPPortalEditor;

