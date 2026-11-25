import type Database from "better-sqlite3";
export const COOKIE: "__Host-itamar_admin_v2";
export const SESSION_SECONDS: number;
export const cookieOptions: { readonly httpOnly:true; readonly secure:true; readonly sameSite:"lax"; readonly path:"/"; readonly maxAge:number };
export type AdminIdentity = { id:string; email:string; role:"owner"|"operator" };
export function makeAdminAuth(db: Database.Database, options?: { now?: () => number }): {
  bootstrapOwnerOffline(input:{ email:string; password:string }):Promise<string>;
  provisionOperatorOffline(input:{ ownerId:string; email:string; password:string }):Promise<string>;
  disableOperator(input:{ ownerId:string; operatorId:string }):boolean;
  login(input:{ email:string; password:string; trustedSourceKey:string }):Promise<string|null>;
  identify(token?:string):AdminIdentity|null;
  logout(token?:string):void;
  team():Array<AdminIdentity & { active:boolean }>;
  ownerReady():boolean;
};
