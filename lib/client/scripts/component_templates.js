/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
"use strict";
var _TEMPLATE_LIST = null;
var _TEMPLATE_MAP = {

  "card-default": { componentClass: "card sp-card", headerClass: "card-header bg-light h5", bodyClass: "card-body" },
  "card-flush": { componentClass: "card sp-card", headerClass: "card-header bg-light h5", bodyClass: "" },
  "note-default": { componentClass: "card sp-card", headerClass: "card-header border-0 bg-white h5", bodyClass: "card-body" },
  "note-flush": { componentClass: "card sp-card", headerClass: "card-header border-0 bg-white h5", bodyClass: "" },
  // position-relative is needed for the proper positioning of component settings menu.
  // Not needed when "card sp-card" is one of the component classes since it defines position: relative
  "blank": { componentClass: "flex-grow-1 position-relative", headerClass: "", bodyClass: "" },
  "jumbotron": { componentClass: "jumbotron position-relative", headerClass: "display-4", bodyClass: "" },
  "borderless": { componentClass: "card border-0", headerClass: "bg-white h4 pt-2 pb-2  border-bottom", bodyClass: "" },
  "flush": { componentClass: "card sp-card", headerClass: "card-header", bodyClass: "" },
  "card-warning": { componentClass: "card sp-component-warning", headerClass: "card-header h5", bodyClass: "card-body bg-white" },
  "note-warning": { componentClass: "card-body sp-component-warning position-relative", headerClass: "h5", bodyClass: "" },
  "card-info": { componentClass: "card sp-component-info", headerClass: "card-header h5", bodyClass: "card-body bg-white" },
  "note-info": { componentClass: "card-body sp-component-info position-relative", headerClass: "h5", bodyClass: "" },
  "card-dark": { componentClass: "card bg-dark text-white", headerClass: "card-header h5", bodyClass: "card-body" },
  "note-dark": { componentClass: "card-body bg-dark text-white position-relative", headerClass: "h5", bodyClass: "" },
  "card-light": { componentClass: "card bg-light", headerClass: "card-header h5", bodyClass: "card-body" },
  "note-light": { componentClass: "card-body bg-light position-relative", headerClass: "h5", bodyClass: "" },
  "card-success": { componentClass: "card sp-component-success", headerClass: "card-header h5", bodyClass: "card-body bg-white" },
  "note-success": { componentClass: "card-body sp-component-success position-relative", headerClass: "h5", bodyClass: "" },
  "card-danger": { componentClass: "card sp-component-danger", headerClass: "card-header h5", bodyClass: "card-body bg-white" },
  "note-danger": { componentClass: "card-body sp-component-danger position-relative", headerClass: "h5", bodyClass: "" },

};

var SPComponentTemplates = {
  init(cTemplates) {
    if (cTemplates) {
      Object.assign(_TEMPLATE_MAP, cTemplates);
    }
    computeTemplateList();
  },
  getTemplateList: function () {
    return _TEMPLATE_LIST;
  },
  getTemplate(key) {
    return _TEMPLATE_MAP[key];
  }
}

function computeTemplateList() {
  var templates = Object.keys(_TEMPLATE_MAP);
  var tlist = [];
  templates.forEach(function (key) {
    tlist.push({ label: key, value: key });
  });
  _TEMPLATE_LIST = tlist;
  return _TEMPLATE_LIST;

}
export default SPComponentTemplates