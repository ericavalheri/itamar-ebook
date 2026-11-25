import { getCatalogProductBySlug, getProductBySlug, type Product } from "./products";

// Product metadata is shared by catalog, reader and checkout, never by client input.
export const VOLUME_2_SLUG = "adicional-insalubridade";
export function getReaderProduct(slug:string): Product | undefined {
  if (slug !== VOLUME_2_SLUG) return getProductBySlug(slug);
  if (process.env.READER_SECOND_VOLUME_ENABLED !== "true") return undefined;
  const product = getCatalogProductBySlug(slug);
  if (!product) return undefined;
  const {catalogOnly:_,...metadata} = product;
  return {...metadata, contentFile:"adicional-insalubridade.html"};
}
