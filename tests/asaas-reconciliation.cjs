const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");
const { randomUUID } = require("node:crypto");
const ts = require("typescript");

const data = fs.mkdtempSync(path.join(os.tmpdir(), "itamar-pix-test-"));
const mockOrigin = "https://admin.example.invalid";
const mockAsaas = "https://asaas.example.invalid/v3";
Object.assign(process.env, {
  DATA_DIR: data, ADMIN_AUTH_MODE: "accounts", ADMIN_ORIGIN: mockOrigin,
  ASAAS_API_BASE_URL: mockAsaas, ASAAS_API_KEY: "test-only", ASAAS_WEBHOOK_TOKEN: "test-only",
  SALES_ENABLED: "false", PIX_CHECKOUT_ENABLED: "false", PIX_OWNER_PILOT_ENABLED: "false",
});
const previousLoad = Module._load;
const previousFetch = global.fetch;
let authToken;
Module._extensions[".ts"] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, "utf8"), {compilerOptions: {
    module: ts.ModuleKind.CommonJS, esModuleInterop: true,
  }}).outputText, filename
);
Module._load = function (name, parent, ...rest) {
  if (name === "next/headers") return { cookies: async () => ({ get: () => ({value: authToken}) }) };
  if (name.startsWith("@/")) name = path.resolve(__dirname, "..", name.slice(2));
  return previousLoad.call(this, name, parent, ...rest);
};
const { db } = require("../lib/db.ts");
const { createOrder, getOrderById } = require("../lib/orders.ts");
const { makeAdminAuth } = require("../lib/admin-auth-core.mjs");
const mail = require("../lib/email.ts");
const { POST: check } = require("../app/api/admin/orders/[id]/check-asaas/route.ts");
const { POST: hook } = require("../app/api/webhooks/asaas/route.ts");
let owner, operator, emailAttempts = 0, failMail = false, streams = 0;
const payments = new Map();
global.fetch = async (url, opts) => {
  assert.equal(opts.method, "GET");
  assert.ok(url.startsWith(mockAsaas + "/payments/"));
  assert.equal(opts.headers.access_token, "test-only");
  streams++;
  const val = payments.get(decodeURIComponent(url.split("/").at(-1)));
  if (!val) return new Response("{}", {status: 503});
  return Response.json(val);
};
mail.sendPurchaseConfirmedEmail = async () => { emailAttempts++; if (failMail) throw Error("simulated SMTP failure"); };
const fixture = (status = "RECEIVED", delta = {}) => {
  const id = randomUUID(), pay = "pay_" + randomUUID();
  createOrder({id, produto:"adicional-periculosidade", nome:"Fixture", email:id+"@example.invalid",
    telefone:"", estado:"SP", cpf:"", valorCentavos:3800, asaasCustomerId:"test", asaasPaymentId:pay,
    pixQrBase64:null, pixCopiaCola:null, pixExpiracao:null});
  const payload = {id:pay, externalReference:id, billingType:"PIX", status, value:38, ...delta};
  payments.set(pay, payload);
  return {id, pay, payload};
};
const req = (id, origin = mockOrigin) => check(new Request(mockOrigin, {method:"POST", headers:{origin}}), {params:Promise.resolve({id})});
const webhook = ({id,pay}, token = "test-only") => hook(new Request(mockOrigin, {
  method:"POST", headers: token ? {"asaas-access-token": token} : {},
  body:JSON.stringify({event:"PAYMENT_RECEIVED",payment:{id:pay,externalReference:id}}),
}));

test.before(async () => {
  const core = makeAdminAuth(db), password = "synthetic-only-password";
  const ownerId = await core.bootstrapOwnerOffline({email:"owner@example.invalid",password});
  await core.provisionOperatorOffline({ownerId,email:"operator@example.invalid",password});
  owner = await core.login({email:"owner@example.invalid",password,trustedSourceKey:"test"});
  operator = await core.login({email:"operator@example.invalid",password,trustedSourceKey:"test"});
});
test.after(() => {
  Module._load = previousLoad; global.fetch = previousFetch;
  db.close(); fs.rmSync(data, {recursive:true,force:true});
});

test("only the authenticated owner, on the configured origin, can look up payments", async () => {
  const {id}=fixture(); const before=streams;
  authToken=undefined; assert.equal((await req(id)).status,401);
  authToken=operator; assert.equal((await req(id)).status,403);
  authToken=owner; assert.equal((await req(id,"https://other.example.invalid")).status,403);
  assert.equal((await req(randomUUID())).status,404);
  assert.equal(streams,before);
});

test("provider identity, order reference, type and amount must match", async () => {
  for(const delta of [{id:"wrong"}, {externalReference:"wrong"}, {billingType:"BOLETO"}, {value:37.99}, {value:"38"}]) {
    const {id}=fixture("RECEIVED",delta);
    assert.equal((await req(id)).status,409);
    assert.equal(getOrderById(id).status,"aguardando_pagamento");
  }
});

test("pending, confirmed-only and provider errors never grant access", async () => {
  const start=emailAttempts;
  for(const status of ["PENDING","CONFIRMED"]) {
    const {id}=fixture(status);
    const response=await req(id);
    assert.equal(response.status,200);
    assert.equal(response.headers.get("cache-control"),"private, no-store");
    assert.equal(getOrderById(id).status,"aguardando_pagamento");
  }
  const {id,pay}=fixture();
  payments.delete(pay);
  assert.equal((await req(id)).status,503);
  assert.equal(getOrderById(id).status,"aguardando_pagamento");
  assert.equal(emailAttempts,start);
});

test("concurrent panel check and webhook approve once and attempt email once", async () => {
  const item=fixture();
  const start=emailAttempts;
  const [panel, event, secondPanel]=await Promise.all([req(item.id),webhook(item),req(item.id)]);
  assert.equal(panel.status,200); assert.equal(secondPanel.status,200);
  assert.equal(event.status,200); assert.equal(await event.text(),"SUCCESS");
  assert.equal(getOrderById(item.id).status,"aprovado");
  assert.equal(emailAttempts-start,1);
  assert.equal((await webhook(item)).status,200);
  assert.equal(emailAttempts-start,1);
});

test("SMTP failure leaves one approval and no duplicate email on retry", async () => {
  const item=fixture(), start=emailAttempts;
  failMail=true;
  try { assert.equal((await req(item.id)).status,200); }
  finally { failMail=false; }
  assert.equal((await webhook(item)).status,200);
  assert.equal(getOrderById(item.id).status,"aprovado");
  assert.equal(emailAttempts-start,1);
});

test("webhook authentication and refund revocation are preserved", async () => {
  const item=fixture();
  assert.equal((await webhook(item,null)).status,401);
  assert.equal((await webhook(item,"wrong")).status,401);
  assert.equal(getOrderById(item.id).status,"aguardando_pagamento");
  assert.equal((await req(item.id)).status,200);
  payments.set(item.pay,{...item.payload,status:"REFUNDED"});
  assert.equal((await webhook(item)).status,200);
  assert.equal(getOrderById(item.id).status,"estornado");
});

test("the check does not revive a locally cancelled order", async () => {
  const item=fixture("PENDING");
  db.prepare("UPDATE orders SET status='cancelado' WHERE id=?").run(item.id);
  payments.set(item.pay,{...item.payload,status:"RECEIVED"});
  const before=streams;
  assert.equal((await req(item.id)).status,200);
  assert.equal(getOrderById(item.id).status,"cancelado");
  assert.equal(streams,before);
});

test("manual orders are not queried and an Asaas-received expired order can be recovered", async () => {
  const {id} = fixture();
  db.prepare("UPDATE orders SET asaas_payment_id=NULL WHERE id=?").run(id);
  const before = streams;
  assert.equal((await req(id)).status,409);
  assert.equal(streams,before);
  const late = fixture("OVERDUE");
  assert.equal((await req(late.id)).status,200);
  assert.equal(getOrderById(late.id).status,"expirado");
  payments.set(late.pay,{...late.payload,status:"RECEIVED"});
  assert.equal((await req(late.id)).status,200);
  assert.equal(getOrderById(late.id).status,"aprovado");
});
