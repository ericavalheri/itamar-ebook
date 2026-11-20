const test = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const source = ts.transpileModule(fs.readFileSync('lib/sales.ts', 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText;
function config(env) { const exports = {}; new Function('exports', 'process', source)(exports, {env}); return exports; }
const complete = { SALES_ENABLED: 'true', ADMIN_PASSWORD: 'test', ADMIN_SESSION_SECRET: 'test', ASAAS_API_KEY: 'test', ASAAS_WEBHOOK_TOKEN: 'test', ASAAS_ENV: 'sandbox', SMTP_HOST: 'smtp.example.com', SMTP_USER: 'access@example.com', SMTP_PASSWORD: 'test', DATA_DIR: '/persistent/data' };
test('closed by default and explicit false even with configured providers', () => { assert.equal(config({}).salesEnabled(), false); assert.equal(config({...complete, SALES_ENABLED:'false'}).salesEnabled(), false); });
test('each prerequisite is required', () => { for (const key of Object.keys(complete)) { const env = {...complete}; delete env[key]; assert.equal(config(env).salesEnabled(), false, key); } });
test('explicit enabled plus complete settings unlocks sales', () => { assert.equal(config(complete).salesEnabled(), true); });
test('reader and admin configuration independent from sales', () => { const c=config({...complete,SALES_ENABLED:'false'}); assert.equal(c.readerLoginConfigured(),true); assert.equal(c.adminLoginConfigured(),true); assert.equal(config({}).readerLoginConfigured(),false); assert.equal(config({}).adminLoginConfigured(),false); });
