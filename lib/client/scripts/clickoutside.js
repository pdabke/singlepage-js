/*
  Adapted from https://github.com/vue-bulma/click-outside#readme distributed under MIT license.
*/
var SPClickOutside = {
  bind: function (el, binding, vNode) {
    if (!validate(binding)) return

    // Define Handler and cache it on the element
    function handler(evt) {
      if (!vNode.context) return

      // some components may have related popup item, on which we shall prevent the click outside event handler.
      var elements = evt.path || (evt.composedPath && evt.composedPath())
      elements && elements.length > 0 && elements.unshift(evt.target)
      
      if (el.contains(evt.target) || isPopup(vNode.context.popupItem, elements)) return

      el.__vueClickOutside__.callback(evt)
    }

    // add Event Listeners
    el.__vueClickOutside__ = {
      handler: handler,
      callback: binding.value
    }
    !isServer(vNode) && document.addEventListener('click', handler)
  },

  update: function (el, binding) {
    if (validate(binding)) el.__vueClickOutside__.callback = binding.value
  },
  
  unbind: function (el, binding, vNode) {
    // Remove Event Listeners
    !isServer(vNode) && document.removeEventListener('click', el.__vueClickOutside__.handler)
    delete el.__vueClickOutside__
  }
}

function validate(binding) {
  if (typeof binding.value !== 'function') {
    // console.warn('[Vue-click-outside:] provided expression', binding.expression, 'is not a function.')
    return false
  }

  return true
}

function isPopup(popupItem, elements) {
  if (!popupItem || !elements)
    return false

  for (let count = 0, len = elements.length; count < len; count++) {
    try {
      if (popupItem.contains(elements[count])) {
        return true
      }
      if (elements[count].contains(popupItem)) {
        return false
      }
    } catch(e) {
      return false
    }
  }

  return false
}

function isServer(vNode) {
  return typeof vNode.componentInstance !== 'undefined' && vNode.componentInstance.$isServer
}

export default SPClickOutside;