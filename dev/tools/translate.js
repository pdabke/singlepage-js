/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
var fs = require('fs-extra');
var process = require('process');
var path = require('path');
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(__dirname, '..', '..', '..', 'credentials', 'google_translate_api.json');
// Imports the Google Cloud Translation library
const {TranslationServiceClient} = require('@google-cloud/translate').v3beta1;

// Instantiates a client
const translationClient = new TranslationServiceClient();

/**
 * TODO(developer): Uncomment these variables before running the sample.
 */
const projectId = fs.readJSONSync(process.env.GOOGLE_APPLICATION_CREDENTIALS).project_id;
const location = 'global';
var keys = [];
var values = [];
var translatedValues = [];
var messages = fs.readJSONSync(path.resolve(__dirname, '..', '..', 'lib', 'client', 'locales', 'messages_en-US.json'));

Object.keys(messages).forEach(function(key) {
  keys.push(key);
  let val = messages[key];
  if (val.includes("{")) {
    val = val.replace(/{\s*([a-z,A-Z,0-9]*)\s*}/g, "<abc-$1/>");
    console.log(val);
  }
  values.push(val);
})
// Google API allows upto 128 messages per call
var maxBatchSize = 128;
var processed = 0;

async function translateMessages(lang) {
  while (processed < keys.length) {
    let batchSize = (keys.length - processed) > maxBatchSize ? maxBatchSize : keys.length - processed;
    await translateText(values.slice(processed, processed + batchSize), translatedValues, lang);
    processed = processed + batchSize;
  }
  console.log('Number of messages = ' + keys.length);
  console.log('Number of translated messages = ' + translatedValues.length);
  for (let ii=0; ii<translatedValues.length; ii++) {
    translatedValues[ii] = translatedValues[ii].replace(/<abc-([a-z,A-Z,0-9]*)\/>/g, "{$1}");

  }
  var tMessages = {};
  for (let ii=0; ii<keys.length;ii++) {
    tMessages[keys[ii]] = translatedValues[ii]
  }

  fs.writeJSONSync(path.resolve(__dirname, '..', '..', 'lib', 'client', 'locales', 'messages_' + lang + '.json'), tMessages);
}

async function translateText(input, output, lang) {
  // Construct request
  const request = {
    parent: translationClient.locationPath(projectId, location),
    contents: input,
    mimeType: 'text/html', // mime types: text/plain, text/html
    sourceLanguageCode: 'en-US',
    targetLanguageCode: lang,
  };

  // Run request
  const [response] = await translationClient.translateText(request);

  for (const translation of response.translations) {
    output.push(translation.translatedText);
  }
}

translateMessages('mr');