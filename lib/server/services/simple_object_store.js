/**
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 */
'use strict';
const path = require('path');
const fs = require('fs-extra');
var _TABLES = {};
var _SCHEMA = {};
var _DB_DIR = null;
var _SP = null;
var _SCHEMA_FILE = null;
const ObjectStore = {
    async init(config, SP) {
      /*
      _SP = SP;
      if (config.SIMPLE_OBJECT_STORE) _DB_DIR = config.SIMPLE_OBJECT_STORE.DB_DIR;
      if (!_DB_DIR) {
        let distDir = process.env.SP_DIST_DIR ? path.resolve(process.env.SP_DIST_DIR) : path.resolve(process.env.SP_APP_BASE);
        _DB_DIR = path.resolve(distDir, 'store', 'db');
      }
      await fs.ensureDir(_DB_DIR);
      _SCHEMA_FILE = path.resolve(_DB_DIR, 'schema.json');
      if (fs.existsSync(_SCHEMA_FILE)) _SCHEMA = await fs.readJSON(_SCHEMA_FILE);
      let tableFiles = await fs.readdir(_DB_DIR);
      for (let i=0; i<tableFiles.length; i++) {
        let f = tableFiles[i];
        if (!f.startsWith('table_')) continue;
        let table = await fs.readJSON(path.resolve(_DB_DIR, f));
        _TABLES[f.substring(6)] = table;
      }
      */
    },

    async createType(objType, schemaDef) {
      if (_SCHEMA[objType]) return new _SP.AppError("Object type " + objType + ' already exists.');
      _SCHEMA[objType] = schemaDef;
      _TABLES[objType] = [];
      await fs.writeFile(path.resolve(_DB_DIR, 'table_' + objType + '.json'), JSON.stringify(_TABLES[objType]));
      await fs.writeFile(_SCHEMA_FILE, JSON.stringify(_SCHEMA));
      return schemaDef;
    },

    async deleteType(objType) {
      if (!_SCHEMA[objType]) return new _SP.AppError("Object type " + objType + ' does not exists.');
      await fs.unlink(path.resolve(_DB_DIR, 'table_' + objType + '.json'));
      _SCHEMA[objType] = undefined;
      await fs.writeFile(_SCHEMA_FILE, JSON.stringify(_SCHEMA));
      return objType;
    },

    async updateType(objType, schemaDef) {
      throw new Error('Unsupported');
    },

    async listTypes() {
      return Object.keys(_SCHEMA);
    },

    async getTypeSchema(objType) {
      return _SCHEMA[objType];
    },

    async insert(objType, obj) {
      if (!_TABLES[objType]) return new _SP.AppError('Object type does not exist');
      _TABLES[objType].push(obj);
      await fs.writeFile(path.resolve(_DB_DIR, 'table_' + objType + '.json'), _TABLES[objType]);
    },

    async update(objType, obj, fields, filter) {
      if (!_TABLES[objType]) return new _SP.AppError('Object type does not exist');
      if (filter) {
        throw new Error('Update filter is currently not supported');
      } else {
        let idColumn = _SCHEMA[objType].primaryKey;
        if (!obj[idColumn]) return new _SP.AppError('Missing object ID');
        let index = findObjectIndex(objType, idColumn, obj[idColumn]);
        if (index == -1) return new _SP.AppError('Non-existent object');
        obj = JSON.parse(JSON.stringify(obj))
        if (!fields) {
          _TABLES[objType] = obj;
        } else {
          fields.forEach(key => {
            _TABLES[objType][index][key] = obj[key];
          });
        }
      }
      await fs.writeFile(path.resolve(_DB_DIR, 'table_' + objType + '.json'), _TABLES[objType]);
    },

    async delete(objType, objId) {
      if (!_TABLES[objType]) return new _SP.AppError('Object type does not exist');
      let idColumn = _SCHEMA[objType].primaryKey;
      for (let i=0; i<_TABLES[objType].length; i++) {
        if (_TABLES[objType][i][idColumn] == objId) {
          await fs.writeFile(path.resolve(_DB_DIR, 'table_' + objType + '.json'), _TABLES[objType]);
          return _TABLES[objType].splice(i,1);
        }
      }
      return null;
    
    },

    async query(q) {
      let objType = q.objectType;
      if (!objType) return new _SP.AppError('Invalid query spec. Must specify objectType');
      let results = [];
      let limit = q.limit ? q.limit : 1000;
      let offset = q.offset ? q.offset : 0;
      let count = 0;
      if (_TABLES[objType].length <= offset) return results;
      if (!q.filter) {
        let start = offset;
        let end = offset + limit;
        if (end >= _TABLES[objType].length) end = _TABLES[objType].length - 1;
        for (let i=start; i<end; i++) {
          results.push(JSON.parse(JSON.stringify(_TABLES[objType][i])));
        }
        return results;
      }
      for (let i=0; i<_TABLES[objType].length; i++) {
        let val = match(_TABLES[objType][i], q);
        if (val) {
          count++;
          if (count < offset) continue;
          results.push(JSON.parse(JSON.stringify(val)));
        }
        if (results.length == limit) return results;
      }
      return results;
    }
};

function findObjectIndex(objType, idColumn, idValue) {
  for (let i=0; i<_TABLES[objType].length; i++) {
    if (_TABLES[objType][i][idColumn] == idValue) return i;
  }
  return -1;
}

function match(obj, filter) {
  
}
module.exports = ObjectStore;