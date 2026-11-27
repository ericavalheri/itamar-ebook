export type PixReceipt = { id:string; amountCentavos:number; qrBase64:string; copyPaste:string };
export function parsePixReceipt(input:unknown): PixReceipt | null {
  if (!input || typeof input !== "object") return null;
  const {id,amountCentavos,pix,status} = input as Record<string,unknown>;
  if (typeof id !== "string" || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id) ||
      typeof amountCentavos !== "number" || !Number.isSafeInteger(amountCentavos) || amountCentavos<1) return null;
  if (status === "aprovado" || status === "expirado" || status === "cancelado" ||
      status === "bloqueado" || status === "estornado") return {id,amountCentavos,qrBase64:"",copyPaste:""};
  if (!pix || typeof pix!=="object") return null;
  const {qrBase64,copyPaste} = pix as Record<string,unknown>;
  if (typeof qrBase64!=="string" || qrBase64.length>300000 || !/^iVBORw0KGgo[A-Za-z0-9+/=]+$/.test(qrBase64) ||
      typeof copyPaste!=="string" || copyPaste.length<10 || copyPaste.length>2000) return null;
  return {id,amountCentavos,qrBase64,copyPaste};
}
