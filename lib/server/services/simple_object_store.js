/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
'use strict';
const fs = require('fs');
var db = null;
const ObjectStore = {
    async init(options) {
        // db = JSON.parse(fs.readFileSync(), "utf-8")
    },
    async getObject(objType, params) {

    }
};
module.exports = ObjectStore;