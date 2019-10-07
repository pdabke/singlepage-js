/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
"use strict";
const process = require('process');
const NodeMailer = require('nodemailer');
const ServiceGateway = require('../core/service_gateway')

var _CONFIG = null;
var smtpConfig = {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // upgrade later with STARTTLS
  auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
  }
};
var transporter = NodeMailer.createTransport(smtpConfig);

/**
 * Internal service that sends raw emails or emails composed via templates
 */
const EmailService = {
  init(config) {
    _CONFIG = config;
  },
  async sendEmail(from, to, subject, textContent, htmlContent) {
    var message = {
      from: from,
      to: to,
      subject: subject,
      text: textContent,
      html: htmlContent
    };
    await transporter.sendMail(message);
  },

  async sendEmailWithTemplate(tname, context, userInfo, clientInfo) {
    var t = await ServiceGateway.getInternalService('TemplateService').evaluateTemplate(tname, context, userInfo, clientInfo);
    await EmailService.sendEmail(_CONFIG.SYSTEM_EMAIL_SENDER, userInfo.email, t.subject, t.textBody, t.htmlBody);
  }
};
module.exports = EmailService;