/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
const process = require('process');
const fs = require('fs');
const path = require('path');
const ServiceGateway = require('../core/service_gateway');
const Namespace = require('../core/namespace');
const Config = require('../core/server_config');

// Main email template file
var _HTML_TEMPLATE = null;
var _TEXT_TEMPLATE = null;
var _EMAIL_TEMPLATES = null;
var TemplateService = {
  init(config) {
    var tFile = null;

    if (process.env.SP_DIST_DIR) {
      tFile = path.resolve(process.env.SP_DIST_DIR, 'server', 'resources', 'email_template.html');
    } else if (process.env.NODE_ENV != 'development') {
      tFile = path.resolve(process.env.SP_APP_BASE, 'dist', 'server', 'resources', 'email_template.html');
    } else {
      tFile = path.resolve(process.env.SP_APP_BASE, 'src', 'templates', 'email_template.html');
      if (!fs.existsSync(tFile)) {
        tFile = path.resolve(process.env.SP_HOME, 'dev', 'resources', 'email_templates', 'email_template.html');
      }
    }
    _HTML_TEMPLATE = fs.readFileSync(tFile, 'UTF-8');

    if (process.env.SP_DIST_DIR) {
      tFile = path.resolve(process.env.SP_DIST_DIR, 'server', 'resources', 'email_template.txt');
    } else if (process.env.NODE_ENV != 'development') {
      tFile = path.resolve(process.env.SP_APP_BASE, 'src', 'templates', 'email_template.txt');
      if (!fs.existsSync(tFile)) {
        tFile = path.resolve(process.env.SP_HOME, 'dev', 'resources', 'email_templates', 'email_template.txt');
      }
    }

    _TEXT_TEMPLATE = fs.readFileSync(tFile, 'UTF-8');
    
    if (config.EMAIL_TEMPLATES) {
      Object.assign(_EMAIL_TEMPLATES, config.EMAIL_TEMPLATES);
    }
  },
  async getTemplate(templateName, tenantId) {
    template = ServiceGateway.getInternalService('Cache').permanentCache.get(Namespace.TEMPLATE, templateName);
    if (! template) {
      template = await getTemplateInternal(tenantId, templateName);
    }
    return template;
  },
  
  async evaluateTemplate(tname, context, userInfo, clientInfo) {
    template = await TemplateService.getTemplate(tname, clientInfo.tenantId);
    output = {};
    context.tenantName = Config.SITE_TITLE;
    context.logoURL = Config.EMAIL_LOGO_URL.startsWith('http') ? Config.EMAIL_LOGO_URL : clientInfo.siteURL + Config.EMAIL_LOGO_URL;
    output.subject = Mustache.render(template.subject, context);
    var preview = Mustache.render(template.preview, context);
    output.textBody = Mustache.render(template.textBody, context);
    output.htmlBody = Mustache.render(template.htmlBody, context);
    
    uname = userInfo.firstName ? userInfo.firstName : userInfo.screen_name;
    output.textBody = Mustache.render(_TEXT_TEMPLATE, {body: output.textBody, username: uname})
    output.htmlBody = Mustache.render(_HTML_TEMPLATE, 
      {body: output.htmlBody, username: uname, subject: output.subject, preview: preview});
    return output;
  }
};

function getTemplateInternal(tenantId, templateName) {
  return _EMAIL_TEMPLATES[templateName];
}

_EMAIL_TEMPLATES  = {
  PASSWORD_CHANGE_ALERT_EMAIL: {
      "subject": "Your {{tenantName}} password has been changed", 
      "preview": "You recently changed your password",
      "text-body": "You recently changed your {{tenantName}} password. If you do not recall changing your password, please contact support for assistance.",
      "html-body": "You recently changed your {{tenantName}} password. If you do not recall changing your password, please contact support for assistance."
  },

  PASSWORD_RESET_ALERT_EMAIL: {
      "subject": 'Your {{tenantName}} password has been reset', 
      "preview": 'Please reset your password if you do not remember resetting your password recently.',
      "text-body": 'Your password has been reset. If you do not recall resetting your password, please contact support for assistance.',
      "html-body": 'Your password has been reset. If you do not recall resetting your password, please contact support for assistance.'
  },

  RESET_PASSWORD_EMAIL: { 
      "subject": '{{tenantName}} password reset request', 
      "preview": 'Link to reset your {{tenantName}} password',
      "html-body":
          `<p>Please enter code {{{resetCode}}} on the login page if you still have it open. Alternatively click on the &quot;Reset Password&quot; button below to reset your password. 
  The password reset link will expire in 24 hours.</p>
  <p style="text-align: center; padding: 4px;">
    <a class="button-a button-a-primary" href="{{{siteURL}}}/login.html?mode=login&reset_code={{{resetCode}}}" style="background: #D35400; border: 1px solid #D35400; font-family: Lato, sans-serif; font-size: 15px; line-height: 15px; text-decoration: none; padding: 10px 12px; color: #ffffff; border-radius: 2px;">Reset Password</a>
  </p>

    <p style="text-align: center;">Password Reset URL: {{{siteURL}}}/login.html?mode=login&amp;reset_code={{{resetCode}}}</p>`,
    "text-body":
      `Please enter code {{{resetCode}}} on the login page if you still have it open. Alternatively click on the URL below or copy it in your browser address bar. The password reset link will expire in 24 hours.
       
       Password Reset URL: {{{siteURL}}}/login.html?mode=login&reset_code={{{resetCode}}}
  `
  },

  REGISTRATION_EMAIL: {
      "subject": '{{tenantName}} registration request', 
      "preview": 'Link to register with {{tenantName}}',
      "html-body": `<p>Please enter code {{{regCode}}} on the registration page if you still have it open. Alternatively click on the &quot;Register&quot; button below to complete creating your user account. 
  The registration link will expire in 24 hours.</p>
  <p style="text-align: center; padding: 4px;">
    <a class="button-a button-a-primary" href="{{{siteURL}}}/login.html?mode=register&registration_code={{regCode}}" style="background: #D35400; border: 1px solid #D35400; font-family: Lato, sans-serif; font-size: 15px; line-height: 15px; text-decoration: none; padding: 10px 12px; color: #ffffff; border-radius: 2px;">Register</a>
  </p>`,
  "text-body":
  `Please enter code {{{regCode}}} on the registration page if you still have it open. Alternatively click on the URL below or copy it in your browser address bar. The registration link will expire in 24 hours.

    Registration URL: {{{siteURL}}}/login.html?mode=register&registration_code={{{regCode}}}
      `
  }

};
module.exports = TemplateService;