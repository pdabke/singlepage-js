/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
'use strict'
const fs = require('fs');
const process = require('process');
const path = require('path');
const http = require('http');
const https = require('https');
const ServiceLoader = require('./service_loader');
const ServiceGateway = require('./service_gateway');
const ServiceDirectory = require('./service_directory');
const ComponentRegistry = require('./component_registry');
const LocalFileServer = require('./local_file_server');
const Response = require('./response');

var FileStore = null;

var _HTTP_PORT = 8080;
var _HTTPS_PORT = 8443;

const SPServer = {

  async start(config, buildOutput) {
    var config = constructConfig(config, buildOutput);
    await ServiceLoader.init(config);
    Response.init(config);
    ComponentRegistry.init(buildOutput);
    LocalFileServer.init(config, buildOutput);
    FileStore = ServiceDirectory.getInternalService("FileStore");

    if (process.env.PORT) _HTTP_PORT = process.env.PORT;
    if (process.env.HTTPS_PORT) _HTTPS_PORT = process.env.HTTPS_PORT;

    if ((process.env.HTTPS_CERT && !process.env.HTTPS_KEY) || (process.env.HTTPS_KEY && !process.env.HTTPS_CERT)) {
      console.error('You must define both environment variables: HTTPS_KEY and HTTPS_CERT');
      return;
    }

    if (process.env.HTTPS_KEY) {
      // HTTPS server will do the request processing
      let key = (process.env.HTTPS_KEY.length < 200) ? fs.readFileSync(path.resolve(process.env.HTTPS_KEY)) : process.env.HTTPS_KEY;
      let cert = (process.env.HTTPS_CERT.length < 200) ? fs.readFileSync(path.resolve(process.env.HTTPS_CERT)) : process.env.HTTPS_CERT;
      let httpsServer = https.createServer(
        {
          key: key,
          cert: cert
        }, router);

      // HTTP server will redirect all requests to https
      let httpServer = http.createServer(redirector);

      console.log('Starting http server on port ' + _HTTP_PORT);
      console.log('Starting https server on port ' + _HTTPS_PORT);

      httpServer.listen(_HTTP_PORT);
      httpsServer.listen(_HTTPS_PORT);
    } else {
      let httpServer = http.createServer(router);
      httpServer.listen(_HTTP_PORT);
      console.log('Starting http server on port ' + _HTTP_PORT);
    }
  },

  // The following 2 calls are only needed in the development mode
  reloadIndexFile() {
    LocalFileServer.readIndexFile();
  },

  serviceChanged(path, action) {
    ServiceLoader.serviceChanged(path, action);
  }
}

// Used to redirect http -> https when https is configured
function redirector(request, response) {
  response.on('error', (err) => {
    console.error(err);
  });
  let sHost = request.headers.host.includes(':') ? request.headers.host.substring(0, request.headers.host.indexOf(':')) :
    request.headers.host;
  response.writeHead(302, {
    'Location': 'https://' + sHost + ':' + _HTTPS_PORT + request.url
  });
  response.end();

}
function router(request, response) {
  const { headers, method, url } = request;

  // Log response errors to console. May want to consider the ability to provide error handler
  response.on('error', (err) => {
    console.error(err);
  });

  // Return a Bad Request response. 
  request.on('error', (err) => {
    console.error(err);
    response.statusCode = 400;
    response.end();
  });

  // Route requests
  try {
    if (method === 'OPTIONS') {
      Response.options(response);
    } else if (method === 'POST') {
      if (request.headers['sp-file-upload']) {
        FileStore.handleFileUpload(request, response);
      } else if (request.headers['content-type'] && request.headers['content-type'].startsWith( 'application/json')) {
        handleServiceRequest(request, response);
      } else {
        Response.invalidRequest(response);
      }
    } else if (method === 'GET') {
      if (request.url.includes('..')) return Response.notFound(res);
      if (request.url.indexOf('/files/') != -1) {
        FileStore.handleFileDownload(request, response, request.url.substring(request.url.indexOf('/files/') + 7));
      } else if (request.url.indexOf('/sp-files/') != -1) {
        LocalFileServer.handleSPFileRequest(response, request.url.substring(request.url.indexOf('/sp-files/') + 10));
//      } else if (request.url.endsWith('favicon.ico')) {
//        Response.sendFile(response, _FAVICON, 'favicon.ico');
      } else if (request.url.endsWith('robots.txt') || request.url.endsWith('manifest.json')
          || request.url.endsWith('spicon.png') || request.url.endsWith('apple-touch-icon.png') 
          || request.url.endsWith('favicon.ico')) {
            let idx = request.url.indexOf('/') + 1;
        LocalFileServer.handleSPFileRequest(response, request.url.substring(idx));
      } else {
        LocalFileServer.handleIndexFileRequest(request, response, 'index.html');
      }
    }
  } catch (e) {
    console.log(e.stack)
    Response.internalError(response);
  }

}

function handleServiceRequest(request, response) {
  let body = [];
  request.on('data', (chunk) => {
    body.push(chunk);
  }).on('end', () => {
    body = Buffer.concat(body).toString();
    try {
      body = JSON.parse(body);
    } catch (e) {
      return Response.invalidRequest(response, 'Invalid JSON.');
    }
    ServiceGateway.handleServiceRequest(request, response, body);
  });
}

function constructConfig(config, buildOutput) {
  var serverConfig = require('./server_config');
  var commonConfig = require('../../common/config');
  var extConfig = buildOutput ? buildOutput.config : config;
  if (!extConfig) extConfig = {};
  var config = {};
  Object.assign(config, commonConfig, serverConfig, extConfig);
  return config;
}
module.exports = SPServer;

