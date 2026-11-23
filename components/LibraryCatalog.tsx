"use client";
import { useId, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/products";
import { formatMoney } from "@/lib/money";
import BookCover from "./BookCover";
import { filterCatalog, seriesName } from "./catalog-filter";

export default function LibraryCatalog({ products, canBuy }: { products: Product[]; canBuy: boolean }) {
  const [query, setQuery] = useState("");
  const [serie, setSerie] = useState("");
  const id = useId();
  const series = Array.from(new Set(products.map((product) => seriesName(product.serie))));
  const results = filterCatalog(products, query, serie);
  const reset = () => { setQuery(""); setSerie(""); };
  return (
    <div>
      <div className="catalog-tools" role="search" aria-label="Buscar e-books na biblioteca">
        <div className="catalog-field catalog-search">
          <label htmlFor={`${id}-search`}>Busque seu próximo tema</label>
          <div className="search-input-wrap"><span aria-hidden="true">⌕</span><input id={`${id}-search`} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar pelo título" autoComplete="off" /></div>
        </div>
        <div className="catalog-field"><label htmlFor={`${id}-series`}>Série</label><select id={`${id}-series`} value={serie} onChange={(event) => setSerie(event.target.value)}><option value="">Todas as séries</option>{series.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
      </div>
      <div className="catalog-summary"><p role="status" aria-live="polite" aria-atomic="true">{results.length} {results.length === 1 ? "título encontrado" : "títulos encontrados"}</p>{(query || serie) && <button type="button" className="text-button" onClick={reset}>Limpar filtros</button>}</div>
      {results.length ? <div className="catalog-grid">{results.map((product) => <article className="editorial-book" key={product.slug}>
        <Link className="catalog-cover-link" href={`/livros/${product.slug}`} aria-label={`Conhecer ${product.titulo}`}><div className="catalog-cover"><BookCover serie={product.serie} titulo={product.titulo} titleSize="1.8rem" /></div><span className="cover-caption">HONESTAMENTE, ITAMAR <span aria-hidden="true">↗</span></span></Link>
        <div className="catalog-book-copy"><p className="editorial-eyebrow">{product.serie}</p><h3><Link href={`/livros/${product.slug}`}>{product.titulo}</Link></h3><p className="book-description">{product.descricaoCurta}</p><div className="book-card-bottom"><div><span className="book-price">{formatMoney(product.precoCentavos)}</span><span className="book-availability">{canBuy ? "E-book digital" : "Vendas em breve"}</span></div><div className="catalog-card-actions">{canBuy && <Link className="editorial-button editorial-button-sm" href={`/comprar/${product.slug}`}>Comprar</Link>}<Link className="editorial-link" href={`/livros/${product.slug}`}>Conhecer o e-book <span aria-hidden="true">↗</span></Link></div></div></div>
      </article>)}</div> : <div className="catalog-empty"><span aria-hidden="true">⌕</span><h3>Nenhum título por aqui.</h3><p>Tente outra palavra ou veja todos os títulos da biblioteca.</p><button className="editorial-button" type="button" onClick={reset}>Ver todos os títulos</button></div>}
    </div>
  );
}
