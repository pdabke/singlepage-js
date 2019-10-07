/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
'use strict'
const EmailTemplates = {
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
module.exports = EmailTemplates;