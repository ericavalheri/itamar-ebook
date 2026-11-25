import { getOrderByActiveSession, getReaderEntitledSlugs } from "./orders";
import { CATALOG_PRODUCTS } from "./products";
import { getReaderProduct } from "./reader-registry";

export function resolveReaderTitle(sessionId: string | undefined, requested: string | null) {
  const anchor = sessionId ? getOrderByActiveSession(sessionId) : undefined;
  if (!anchor) return { kind:"invalid-session" } as const;
  if (requested !== null && (requested.length > 128 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(requested))) return {kind:"unavailable"} as const;
  const allowed = new Set(getReaderEntitledSlugs(anchor.email));
  const product = getReaderProduct(requested ?? anchor.produto);
  if (!product || !allowed.has(product.slug)) return {kind:"unavailable"} as const;
  const titles = CATALOG_PRODUCTS.filter(p => allowed.has(p.slug) && getReaderProduct(p.slug)).map(({slug,titulo}) => ({slug,titulo}));
  return {kind:"ok",product,titles} as const;
}
