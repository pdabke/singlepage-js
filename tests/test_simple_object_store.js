const process = require('process');
const path = require('path');
const fs = require('fs-extra');
const AppError = require('../lib/server/core/app_error');
const ObjectService = require('../lib/server/services/simple_object_store');

fs.ensureDirSync(path.resolve('..', 'dev', 'dist'));
const config = {};
const SP = { AppError: AppError}
process.env.SP_DIST_DIR = path.resolve('..', 'dev', 'dist');
/*
id serial PRIMARY KEY,
creation_time int DEFAULT extract(epoch from now())::int,
last_access_time int DEFAULT 0,
auth_type authtype DEFAULT 'NATIVE',
acct_status acctstatus DEFAULT 'ACTIVE',
tenant_id int REFERENCES sp_tenant(id) ON DELETE CASCADE,
cred_version smallint DEFAULT 0,
email text DEFAULT NULL,
phone_country_code smallint,
phone_number bigint,
pass_word text DEFAULT NULL,
first_name text DEFAULT NULL,
last_name text DEFAULT NULL,
screen_name text DEFAULT NULL,
avatar text DEFAULT NULL,
tenant_roles userrole[] DEFAULT NULL,
user_data jsonb DEFAULT '{}',
UNIQUE(tenant_id, email),
UNIQUE(tenant_id, screen_name)
*/
const userType = {
  columns: [
    {name: 'id', type: 'SERIAL' , primaryKey: true},
    {name: 'creation_time', type: 'INT'},
    {name: 'last_access_time', type: 'INT'},
    {name: 'auth_type', type: 'TEXT', default: 'NATIVE'},
    {name: 'acct_status', type: 'TEXT', default: 'ACTIVE'},
    {name: 'cred_version', type: 'SMALLINT', default: 0},
    {name: 'pass_word', type: 'TEXT'},
    {name: 'first_name', type: 'TEXT'},
    {name: 'last_name', type: 'TEXT'},
    {name: 'screen_name', type: 'TEXT'},
    {name: 'email', type: 'TEXT'},
    {name: 'avatar', type: 'TEXT'},
    {name: 'roles', type: 'TEXT[]'}
  ]
}
async function test() {
  await ObjectService.init(config, SP);
  await ObjectService.deleteType('SP_USER');
  await ObjectService.createType('SP_USER', userType);
  var types = await ObjectService.listTypes();
  console.log(JSON.stringify(types));
}

test();