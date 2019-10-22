/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
"use strict";
import SPConstants from '../../common/constants.js';
import SPModal from './modal_desktop';
import SPUtil from './client_util';

var SPRPC = {
    siteURL: SPUtil.computeSiteURL(),
    serviceURL: SPUtil.computeSiteURL(),
    invoke: function (service, m, params, successHandler, appErrorHandler) {
        var sRetry = service, mRetry = m, pRetry = params, shRetry = successHandler, ehRetry = appErrorHandler;
        var xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        xhr.open("POST", SPRPC.serviceURL, true);
        xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
        xhr.setRequestHeader('SP-Site-URL', SPRPC.serviceURL);
        // send the collected data as JSON
        var rpcBody = {};
        rpcBody.service = service;
        rpcBody.method = m;
        rpcBody.params = params;

        xhr.onloadend = function () {
            if (xhr.status == 0) {
                // onerror handler will be called in this case, just return
                return;
            }
            
            var resp = xhr.responseText ? xhr.responseText : '{}';
            var respObj = null;
            try {
                respObj = JSON.parse(resp);
            } catch (e) {
                SPModal.showErrorDialog('error_generic');
                return;
            }
            if (respObj.status == SPConstants.RETURN_SUCCESS) {
                if (successHandler) successHandler(respObj.result);
            } else if (!appErrorHandler) {
                if (status == SPConstants.RETURN_NO_CONNECTION) {
                    SPModal.showErrorDialog('error_no_connection', ['msg_retry'], function() {
                        SPRPC.invoke(sRetry, mRetry, pRetry, shRetry, ehRetry);
                    });
                    return;
                } else {
                  let msg = 'error_generic';
                  if (respObj.status == SPConstants.RETURN_ACCESS_DENIED) msg = 'error_access_denied';
                  else if (respObj.status == SPConstants.RETURN_APP_ERROR) msg = respObj.error ? respObj.error : 'error_generic';
                  else if (respObj.status == SPConstants.RETURN_INTERNAL_ERROR) msg = 'error_internal';
                  else if (respObj.status == SPConstants.RETURN_LOGIN_REQUIRED) msg = 'error_login_required';
                  SPModal.showErrorDialog(msg);
                  return;
                }        
            } else if (respObj.status == SPConstants.RETURN_APP_ERROR) {
                appErrorHandler(SPConstants.RETURN_APP_ERROR, respObj.error, respObj.result);
            } else if (respObj.status == SPConstants.RETURN_LOGIN_REQUIRED) {
                appErrorHandler(SPConstants.RETURN_LOGIN_REQUIRED, 'error_login_required', null);
            } else if (respObj.status == SPConstants.RETURN_ACCESS_DENIED) {
                appErrorHandler(SPConstants.RETURN_LOGIN_REQUIRED, 'error_access_denied', null);
            } else {
                appErrorHandler(SPConstants.RETURN_INTERNAL_ERROR, 'error_internal', null);
            }

        };

        xhr.onerror = function () {
            if (appErrorHandler) {
                appErrorHandler(SPConstants.RETURN_NO_CONNECTION, 'error_no_connection', null);
            } else {
                SPModal.showErrorDialog('error_no_connection', ['msg_retry'], function() {
                    SPRPC.invoke(sRetry, mRetry, pRetry, shRetry, ehRetry);
                });
            }
        }

        xhr.send(JSON.stringify(rpcBody));            

    },

    uploadFiles: function (files, access_type, successHandler, appErrorHandler) {
        var xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        xhr.open("POST", SPRPC.serviceURL, true);
        xhr.setRequestHeader('SP-Site-URL', SPRPC.serviceURL);
        xhr.setRequestHeader('SP-File-Upload', access_type);
        // send the collected data as FormData
        var formData = new FormData();
        formData.append("num_files", files.length);
        for (let i=0; i<files.length; i++) {
            formData.append("attachments" + i, files[i]);
        }

        xhr.onloadend = function () {
            if (xhr.status == 0) {
                // onerror handler will be called in this case, just return
                return;
            } else if (xhr.status != 200) {
                appErrorHandler(SPConstants.RETURN_INTERNAL_ERROR, 'Oops! Something went wrong. Please try your request at a later time.', null);
                return;
            }
            
            var resp = xhr.responseText;
            if (!resp) {
                appErrorHandler(SPConstants.RETURN_INTERNAL_ERROR, 'Oops! Something went wrong. Please try your request at a later time.', null);
                return;
            }
            var respObj = JSON.parse(resp);
            if (respObj.status == SPConstants.RETURN_SUCCESS) {
                successHandler(respObj.result);
            } else if (respObj.status == SPConstants.RETURN_APP_ERROR) {
                appErrorHandler(SPConstants.RETURN_APP_ERROR, respObj.error, respObj.result);
            } else if (respObj.status == SPConstants.RETURN_LOGIN_REQUIRED) {
                appErrorHandler(SPConstants.RETURN_LOGIN_REQUIRED, 'error_login_required', null);
            } else if (respObj.status == SPConstants.RETURN_ACCESS_DENIED) {
                appErrorHandler(SPConstants.RETURN_LOGIN_REQUIRED, 'error_access_denied', null);
            } else {
                appErrorHandler(SPConstants.RETURN_INTERNAL_ERROR, 'error_internal', null);
            }

        };

        xhr.onerror = function () {
            appErrorHandler(SPConstants.RETURN_INTERNAL_ERROR, 'Failed to connect to our servers. Please check your Wi-Fi or cellular data settings for this app.', null);
        }
                
        xhr.send(formData);

    }

};
export default SPRPC;