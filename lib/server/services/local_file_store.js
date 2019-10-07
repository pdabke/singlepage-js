/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
'use strict';
const fs = require('fs');
const path = require('path');
const Formidable = require('formidable');
const Response = require('../core/response');
const Constants = require('../../common/constants');
const Util = require('../util/util');
const ServiceGateway = require('../core/service_gateway')
var _UPLOAD_DIR = null;


const FileStore = {
  init(config) {
    if (config.FILE_UPLOAD_DIR) {
      _UPLOAD_DIR = path.resolve(config.FILE_UPLOAD_DIR);
    }
  },
  async handleFileUpload(req, res) {
    try {
      var sessionInfo = await ServiceGateway.getService('SessionService').getSessionInfo(req, {});
      var user = sessionInfo.userInfo;
      if (!user) {
        Response.loginRequired(res);
        return;
      }
      var accessType = req.headers['sp-file-upload'];
      if (accessType != Constants.FILE_ACCESS_TYPE_AVATAR &&
        accessType != Constants.FILE_ACCESS_TYPE_PUBLIC &&
        accessType != Constants.FILE_ACCESS_TYPE_PRIVATE
      ) return Response.invalidRequest(res);
      var cb = handleAvatarUpload;
      var allowedFileTypes = { jpeg: true, jpg: true, gif: true, png: true };
      storeUploadedFiles(req, res, accessType, cb, allowedFileTypes, user);
    } catch (e) {
      Response.internalError(res, e);
    }
  },

  handleFileDownload(req, res, path) {
    var filePath = _UPLOAD_DIR + path;
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.log('Failed to deliver static file: ' + filePath)
        console.log(err)
        return Response.notFound(res);
      } else {
        try { Response.sendFile(res, data, filePath); } catch (e) { console.log(e); }
      }
    });
  },

  exists(path) {
    if (path.includes('..')) return false;
    var filePath = _UPLOAD_DIR + path;
    return fs.existsSync(filePath);
  }
}

module.exports = FileStore;

function storeUploadedFiles(req, res, accessType, cb, allowedFileTypes, user) {
  var form = new Formidable.IncomingForm(),
    files = [],
    fields = [],
    error = null;

  //setup the incoming
  //form.uploadDir = _UPLOAD_DIR + accessType.toLowerCase();
  form.type = 'multipart';
  form.keepExtensions = true;

  form.encoding = 'utf-8';
  form.maxFieldsSize = 2 * 1024 * 1024;
  form.maxFields = 1000;

  form.onPart = function (part) {
    if (!part.filename || allowedFileTypes[Util.getExtension(part.filename)]) {
      this.handlePart(part);
    }
    else {
      error = 'error_unsupported_file_type';
    }
  }
  form.on('field', function (field, value) {
    fields.push([field, value]);
  })
    .on('file', function (field, file) {
      //on file received
      files.push([field, file]);
    })

    .on('end', function () {
      if (error) {
        return Response.appError(res, error);
      }
      cb(fields, files, res, user)
    });
  form.parse(req);
}
/*
function handleAvatarUpload(fields, files, res, user) {
  if (files.length != 1) {
    console.log('Received ' + files.length + ' files for avatar upload. Expected 1');
    return Response.internalError(res);
  }

  var fileName = Util.getFileNameFromPath(files[0][1].path);
  var dir = Util.getDirectoryFromPath(files[0][1].path);
  Jimp.read(files[0][1].path, (err, imgFile) => {
    if (err) {
      console.log(err);
      return Response.internalError(res);
    }
    var newFilePath = _UPLOAD_DIR + Constants.FILE_ACCESS_TYPE_AVATAR + '/' + fileName;
    imgFile
      .resize(TenantConfig.AVATAR_SIZE, TenantConfig.AVATAR_SIZE) // resize
      .write(newFilePath); // save
    try {
      fs.unlinkSync(files[0][1].path);
    } catch (e) {
      console.log('Failed to delete original avatar file.');
      console.log(e);
    }

    Pool.query(Queries.UserService.UPDATE_USER_AVATAR, [fileName, user.id], (err, dbRes) => {
      if (err) {
        // Delete new avatar file
        try {
          fs.unlinkSync(newFilePath);
        } catch (e) {
          console.log('Failed to delete new avatar file.');
          console.log(e);
        }
        return Response.internalError(res);
      } else {
        var oldAvatar = user.avatar;
        if (oldAvatar) {
          try {
            fs.unlinkSync(_UPLOAD_DIR + Constants.FILE_ACCESS_TYPE_AVATAR + '/' + oldAvatar);
          } catch (e) {
            console.log('Failed to delete old avatar file.');
            console.log(e);
          }
        }
        SessionUtil.uncacheUserInfo(user.id);
        Response.success(res, TenantConfig.AVATAR_URL_PREFIX + fileName);

      }
    })

  });
}
*/