/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
const AppService = require('./app_service');
const UserService = require('./simple_user_service');
const SiteService = require('./simple_site_service');
const SessionService = require('./simple_session_service');
const ObjectStore = require('./simple_object_store');
const Cache = require('./cache_service');
const EmailService = require('./email_service');
const FileStore = require('./local_file_store');
const TemplateService = require('./simple_template_service');
const URLFetcher = require('./url_fetcher');

const BuiltinServices = {
  AppService: AppService,
  UserService: UserService,
  SiteService: SiteService,
  SessionService: SessionService,
  URLFetcher: URLFetcher,
  // ['ObjectStore', 'Cache', 'EmailService', 'FileStore', 'TemplateService'
  ObjectStore: ObjectStore,
  Cache: Cache,
  EmailService: EmailService,
  FileStore: FileStore,
  TemplateService: TemplateService
};

module.exports = BuiltinServices;