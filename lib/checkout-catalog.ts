import { CATALOG_PRODUCTS, type CatalogProduct, type Product } from "./products";
import { getReaderProduct, VOLUME_2_SLUG } from "./reader-registry";
import { readPrivateManuscript } from "./reader-content";
import { pixCheckoutEnabled } from "./sales";

export async function getCheckoutProduct(slug:string): Promise<Product | undefined> {
  if (!pixCheckoutEnabled()) return undefined;
  if (slug === VOLUME_2_SLUG && process.env.PIX_VOLUME_2_ENABLED !== "true") return undefined;
  const product = getReaderProduct(slug);
  if (!product || !(await readPrivateManuscript(product.contentFile))) return undefined;
  return product;
}

export async function catalogWithCheckoutAvailability(): Promise<CatalogProduct[]> {
  return Promise.all(CATALOG_PRODUCTS.map(async ({catalogOnly:_,...listing}) => {
    return await getCheckoutProduct(listing.slug) ? listing : {...listing,catalogOnly:true as const};
  }));
}
