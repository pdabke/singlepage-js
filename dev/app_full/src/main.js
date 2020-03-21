/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
"use strict";
import Vue from 'vue';
import SPApp from '../lib/splib.esm.js';
import App from './App.vue';
import PageNotFound from './PageNotFound.vue';
import './www/css/bootstrap-reboot.css'
import './www/css/bootstrap-grid.css'
import './www/css/bootstrap.css'
import './www/css/sp.css';

Vue.config.productionTip = false;

SPApp.init(SP_CONFIG, SP_MESSAGES, SP_COMPONENT_TEMPLATES, App, PageNotFound);
