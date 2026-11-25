import {promisify} from 'node:util';
import {scrypt, randomBytes, randomUUID, createHash, timingSafeEqual} from 'node:crypto';
const derive=promisify(scrypt);
const params=Object.freeze({N:32768,r:8,p:3,maxmem:64*1024*1024});
const sha=x=>createHash('sha256').update(x).digest('hex');
const validPassword=p=>typeof p==='string' && Buffer.byteLength(p)<=1024 && p.length>0;
const emailKey=e=>typeof e==='string' && e.length<=254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())?e.trim().toLowerCase():null;
export const SESSION_SECONDS=8*3600;
export const can=(identity,action)=>Boolean(identity&&(
 identity.role==='owner'&&['orders:read','orders:grant','orders:block','orders:create','team:manage'].includes(action)
 || identity.role==='operator'&&action==='orders:read'
));
export const COOKIE='__Host-itamar_admin_v2';
export const cookieOptions=Object.freeze({httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:SESSION_SECONDS});
async function hash(p,salt=randomBytes(16)){return (await derive(p,salt,32,params)).toString('hex')}
export function makeAdminAuth(db,{now=Date.now}={}){
 db.exec('CREATE TABLE IF NOT EXISTS itamar_admin_users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, role TEXT NOT NULL CHECK(role IN (\'owner\',\'operator\')), salt TEXT NOT NULL, verifier TEXT NOT NULL, active INTEGER NOT NULL, auth_version INTEGER NOT NULL DEFAULT 0); CREATE TABLE IF NOT EXISTS itamar_admin_sessions (token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL,expires_ms INTEGER NOT NULL); CREATE INDEX IF NOT EXISTS idx_itamar_admin_session_user ON itamar_admin_sessions(user_id); CREATE INDEX IF NOT EXISTS idx_itamar_admin_session_exp ON itamar_admin_sessions(expires_ms); CREATE TABLE IF NOT EXISTS itamar_admin_gate (bucket TEXT PRIMARY KEY,n INTEGER NOT NULL, until_ms INTEGER NOT NULL); CREATE INDEX IF NOT EXISTS idx_itamar_admin_gate_until ON itamar_admin_gate(until_ms);');
 const q=x=>db.prepare(x);
 const tx=(f)=>{db.exec('BEGIN IMMEDIATE');try{const result=f();db.exec('COMMIT');return result}catch(e){db.exec('ROLLBACK');throw e}};
 const dummySalt=randomBytes(16); let inflight=0;
 const consume=(bucket,t,max)=>{q('INSERT INTO itamar_admin_gate(bucket,n,until_ms) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET n=n+1').run(bucket,t+300000);return Number(q('SELECT n FROM itamar_admin_gate WHERE bucket=?').get(bucket).n)<=max};
 return {
  async bootstrapOwnerOffline({email,password}){
   const e=emailKey(email);
   if(!e || !validPassword(password) || password.length<15)throw Error('Invalid setup input');
   const salt=randomBytes(16),verifier=await hash(password,salt),id=randomUUID();
   tx(()=>{if(q('SELECT 1 FROM itamar_admin_users LIMIT 1').get())throw Error('Bootstrap is disabled after first account');
   q('INSERT INTO itamar_admin_users(id,email,role,salt,verifier,active) VALUES(?,?,?,?,?,1)').run(id,e,'owner',salt.toString('hex'),verifier);
   });return id;
  },
  async provisionOperatorOffline({ownerId,email,password}){
   const e=emailKey(email);
   if(!e || !validPassword(password) || password.length<15)throw Error('Invalid setup input');
   const salt=randomBytes(16),verifier=await hash(password,salt),id=randomUUID();
   tx(()=>{
    if(!q("SELECT 1 FROM itamar_admin_users WHERE id=? AND role='owner' AND active=1").get(ownerId))throw Error('Active owner required');
    q('INSERT INTO itamar_admin_users(id,email,role,salt,verifier,active) VALUES(?,?,?,?,?,1)').run(id,e,'operator',salt.toString('hex'),verifier);
   });return id;
  },
  disableOperator({ownerId,operatorId}){
   return tx(()=>{
    if(!q("SELECT 1 FROM itamar_admin_users WHERE id=? AND role='owner' AND active=1").get(ownerId))return false;
    const result=q("UPDATE itamar_admin_users SET active=0,auth_version=auth_version+1 WHERE id=? AND role='operator' AND active=1").run(operatorId);
    if(!result.changes)return false;
    q('DELETE FROM itamar_admin_sessions WHERE user_id=?').run(operatorId);
    return true;
   });
  },
  async login({email,password,trustedSourceKey}){
   const e=emailKey(email);
   if(!e || !validPassword(password))return null;
   if(inflight>=3)return null;
   // Source IDs must originate from a verified trusted-edge adapter, not XFF or other caller-controlled headers.
   if(typeof trustedSourceKey!=='string' || trustedSourceKey.length<1 || trustedSourceKey.length>128)throw Error('Required trusted rate-limit source missing');
   const t=now();
   const ok=tx(()=>{q('DELETE FROM itamar_admin_gate WHERE until_ms<=?').run(t);
     if(!consume('source:'+sha(trustedSourceKey),t,30))return false;
     if(!consume('account:'+sha(e),t,10))return false;
     return consume('pair:'+sha(JSON.stringify([e,trustedSourceKey])),t,5);
   });
   if(!ok)return null;
   const u=q('SELECT * FROM itamar_admin_users WHERE email=?').get(e);let candidate;
   try{inflight++;candidate=await hash(password,u?Buffer.from(u.salt,'hex'):dummySalt)}finally{inflight--}
   const equal=timingSafeEqual(Buffer.from(candidate,'hex'),u?Buffer.from(u.verifier,'hex'):Buffer.alloc(32));
   if(!equal||!u?.active)return null;
   const token=randomBytes(32).toString('base64url');
   return tx(()=>{
    const latest=q('SELECT active,auth_version FROM itamar_admin_users WHERE id=?').get(u.id);
    if(!latest?.active || latest.auth_version!==u.auth_version)return null;
    q('DELETE FROM itamar_admin_sessions WHERE expires_ms<=?').run(now());
    q('INSERT INTO itamar_admin_sessions VALUES(?,?,?)').run(sha(token),u.id,now()+SESSION_SECONDS*1000);
    return token;
   });
  },
  identify(token){
   if(typeof token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(token))return null;
   return q('SELECT u.id,u.email,u.role FROM itamar_admin_sessions s JOIN itamar_admin_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_ms>? AND u.active=1').get(sha(token),now())??null;
  },
  logout(token){
   if(typeof token==='string'&&/^[A-Za-z0-9_-]{43}$/.test(token))q('DELETE FROM itamar_admin_sessions WHERE token_hash=?').run(sha(token));
  },
  team(){return q('SELECT id,email,role,active FROM itamar_admin_users ORDER BY role,email').all().map(u=>({...u,active:Boolean(u.active)}));},
  ownerReady(){return Boolean(q("SELECT 1 FROM itamar_admin_users WHERE role='owner' AND active=1 LIMIT 1").get());},
 };
}
