import AuthorProfile from "@/components/AuthorProfile";
import Link from "next/link";
import { CATALOG_PRODUCTS, PRODUCTS } from "@/lib/products";
import { salesEnabled } from "@/lib/sales";
import BookCover from "@/components/BookCover";
import LibraryCatalog from "@/components/LibraryCatalog";
import LibraryHeader from "@/components/LibraryHeader";

export const metadata = { title: "Honestamente, Itamar | Biblioteca de e-books", description: "Explore a biblioteca de Itamar: e-books interativos para entender, calcular e conferir seus direitos trabalhistas." };
export default function BibliotecaPage() {
  const destaque = PRODUCTS[0];
  const canBuy = salesEnabled();
  return <div className="editorial-site" id="inicio">
    <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <LibraryHeader />
    <main id="conteudo">
      <section className="editorial-hero" aria-labelledby="hero-title"><div className="editorial-shell hero-grid">
        <div className="hero-copy"><p className="editorial-eyebrow"><span className="eyebrow-rule" /> LEITURA QUE ESCLARECE</p><h1 id="hero-title">Conhecimento para<br className="desktop-break" /> entender seus<br className="desktop-break" /> <em>direitos.</em></h1><p className="hero-description">Uma biblioteca de e-books de Itamar sobre direitos trabalhistas. Conteúdo para ler com calma, consultar e levar para o dia a dia.</p><a className="editorial-button" href="#biblioteca">Explorar a biblioteca <span aria-hidden="true">↓</span></a><p className="hero-note">{canBuy ? "E-books digitais · Leitura no celular e no computador" : "Biblioteca em desenvolvimento · Vendas em breve"}</p></div>
        {destaque && <div className="hero-book-stage"><div className="hero-edition"><span>NA BIBLIOTECA</span><span>01 / EM DESTAQUE</span></div><Link prefetch={false} className="hero-featured-cover" href={`/livros/${destaque.slug}`} aria-label={`Conhecer o e-book ${destaque.titulo}`}><BookCover serie={destaque.serie} titulo={destaque.titulo} titleSize="2.1rem" /></Link><div className="hero-book-caption"><span>Entenda. Calcule. Confira.</span><span aria-hidden="true">↗</span></div></div>}
      </div></section>
      <div className="editorial-topic-band"><div className="editorial-shell"><span>DIREITOS TRABALHISTAS</span><span aria-hidden="true">✦</span><span>LEITURA DIGITAL</span><span aria-hidden="true">✦</span><span>CONHECIMENTO NA PRÁTICA</span></div></div>
      <section className="editorial-shell library-section" id="biblioteca" aria-labelledby="library-title"><div className="section-heading"><div><p className="editorial-eyebrow">A BIBLIOTECA</p><h2 id="library-title">Um tema. Novas perspectivas.</h2></div><p>Explore os títulos e conheça o conteúdo de cada e-book antes de escolher sua leitura.</p></div><LibraryCatalog products={CATALOG_PRODUCTS} canBuy={canBuy} /></section>
      <section className="reading-section" id="como-funciona" aria-labelledby="reading-title"><div className="editorial-shell"><div className="section-heading"><div><p className="editorial-eyebrow">DA DESCOBERTA À LEITURA</p><h2 id="reading-title">Como funciona</h2></div><p>{canBuy ? "Conheça o título, confira os detalhes e siga as orientações de acesso." : "Por enquanto, você pode explorar o catálogo. Compras e novos acessos serão disponibilizados após a conclusão dos testes."}</p></div><div className="reading-steps"><article><span className="step-number">01</span><h3>Encontre seu tema</h3><p>Pesquise pelo título ou filtre por série para encontrar o conteúdo que procura.</p></article><article><span className="step-number">02</span><h3>Conheça o e-book</h3><p>Na página de cada título, veja a proposta, os recursos de leitura e o valor.</p></article><article><span className="step-number">03</span><h3>{canBuy ? "Acesse sua leitura" : "Acompanhe o lançamento"}</h3><p>{canBuy ? "Use a área do leitor para acessar seu conteúdo com o e-mail da compra." : "A biblioteca está sendo preparada. Nesta prévia, não recebemos cadastros nem pagamentos."}</p></article></div></div></section>
      <section className="editorial-shell closing-note"><span className="closing-mark" aria-hidden="true">“</span><p>Entender é o primeiro passo<br /><em>para conferir seus direitos.</em></p><a href="#biblioteca" className="editorial-link">Voltar à biblioteca <span aria-hidden="true">↑</span></a></section>
    </main>
    <footer className="editorial-footer"><div className="editorial-shell"><AuthorProfile variant="footer" /></div><div className="editorial-shell footer-inner"><div><p className="footer-brand">Honestamente, Itamar<span>.</span></p><p>Biblioteca de e-books sobre direitos trabalhistas.</p></div><nav aria-label="Navegação do rodapé"><a href="#biblioteca">Biblioteca</a><Link prefetch={false} href="/acessar">Acesso do leitor</Link><a href="#inicio">Voltar ao início ↑</a></nav></div><div className="editorial-shell footer-bottom"><span>Honestamente, Itamar</span><span>{canBuy ? "Biblioteca digital" : "Prévia em desenvolvimento · Vendas desativadas"}</span></div></footer>
  </div>;
}
