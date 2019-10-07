/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
"use strict";
import SPI18N from './i18n';
var modalShown = false;
var SPModal = {
	init: function () {
		var modalHTML =
			'<div class="modal fade" id="sp-modal" tabindex="-1" role="dialog" aria-hidden="true">\
        <div class="modal-dialog modal-dialog-centered pt-1" role="document">\
          <div class="modal-content">\
            <div class="modal-header">\
              <h5 class="modal-title" id="sp-modal-title">Modal title</h5>\
              <button id="sp-modal-close" type="button" class="close" data-dismiss="modal" aria-label="Close">\
                <span aria-hidden="true">&times;</span>\
              </button>\
            </div>\
            <div class="modal-body" id="sp-modal-body">\
            </div>\
            <div class="modal-footer" id="sp-modal-footer">\
              <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>\
              <button type="button" class="btn btn-primary">Save changes</button>\
            </div>\
          </div>\
        </div>\
      </div>';
		// document.getElementById('sp-modal-container').innerHTML = modalHTML;
		var div = document.createElement('div');
		div.innerHTML = modalHTML;
		var modalDOM = div.firstChild;
    document.body.appendChild(modalDOM);
    document.getElementById('sp-modal-close').onclick = SPModal.hideDialog
	},

	hideDialog: function () {
		var modal = document.getElementById('sp-modal')
		modal.className = 'modal fade';
		modal.style.display = 'none';
    // document.body.removeChild(document.body.childNodes.item(document.body.childNodes.length-1));
    var bg = document.getElementById('sp-modal-backdrop');
    if (bg) bg.parentNode.removeChild(bg);
    modalShown = false;
  },
  
	showDialogHelper: function () {
		var modal = document.getElementById('sp-modal')
		modal.className = 'modal fade show';
		modal.style.display = 'block';
		SPModal.createModalBackdrop(SPModal.hideDialog);
	},

	createModalBackdrop() {
		var bg = document.createElement('div');
    bg.className = 'modal-backdrop fade show random';
    bg.id="sp-modal-backdrop"
    document.body.appendChild(bg);
	},

	createDialogCallback: function (i, callback) {
		return function () {
			SPModal.hideDialog();
			callback(i);
		}

	},

	showDialog: function (title, msg, options, callback) {
    if (modalShown) {
      // We are currently showing modal, wait till that goes away
      setTimeout(function() {SPModal.showDialog(title, msg, options, callback);}, 1000);
      return;
    }
    modalShown = true;
		document.getElementById('sp-modal-title').innerHTML = SPI18N
			.localize(title);
		document.getElementById('sp-modal-body').innerHTML = SPI18N
			.localize(msg);
		var footer = document.getElementById('sp-modal-footer');
		while (footer.firstChild) {
			footer.removeChild(footer.firstChild);
		}
		if (!options) {
			options = ['msg_ok'];
		}
		var arrayLength = options.length;
		var footerLen = 0;
		for (let i = 0; i < arrayLength; i++) {
			footerLen = footerLen + options[i].length;
		}
		for (let i = 0; i < arrayLength; i++) {
			/* 
			* Code for mobile. This stacks buttons one below the other if the text is too long.
			var rowFooter = footerLen < 15;
			var opElem = document.createElement("div");
			if (rowFooter) {
				opElem.className = "alert-dialog-button alert-dialog-button--rowfooter";
			} else {
				opElem.className = "alert-dialog-button";
			}
			*/
			var className = (i == 0 ? 'btn btn-primary' : 'btn btn-secondary');
			var opElem = document.createElement("button");
			opElem.className = className;
			opElem.appendChild(document.createTextNode(SPI18N
				.localize(options[i])));
			footer.appendChild(opElem);
			if (callback) {
				opElem.onclick = SPModal.createDialogCallback(i,
					callback);
			} else {
				opElem.onclick = SPModal.hideDialog;
			}
		}
		SPModal.showDialogHelper();

	},

	showErrorDialog: function (msg, options, callback) {
		SPModal.showDialog('<span class="text-danger">'
			+ SPI18N.localize('msg_error') + '</span>', msg, options,
			callback);
	},

	showSuccessDialog: function (msg, callback) {
		SPModal.showDialog('<span class="text-success">'
			+ SPI18N.localize('msg_success') + '</span>', msg, null, callback);
	}


};
export default SPModal;