export function normalizeSearch(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}
export function seriesName(serie: string): string {
  return serie.split(" · ")[0].trim();
}
export function filterCatalog<T extends { titulo: string; serie: string }>(products: T[], query: string, serie: string): T[] {
  const term = normalizeSearch(query);
  return products.filter((product) => (!serie || seriesName(product.serie) === serie) && normalizeSearch(product.titulo).includes(term));
}
