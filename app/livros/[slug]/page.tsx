export const dynamic = "force-dynamic";
import ComprarForm from "@/app/comprar/[slug]/ComprarForm";
import AuthorProfile from "@/components/AuthorProfile";
import { getCheckoutProduct } from "@/lib/checkout-catalog";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalogProductBySlug } from "@/lib/products";
import { formatMoney } from "@/lib/money";
import { ICONS } from "@/components/icons";
import BookCover from "@/components/BookCover";

const salesCopy: Record<string, {
  headline: string; intro: string; takeaways: string[];
  searchTitle: string; searchDescription: string;
  sampleRows: [string, string][]; sampleNote: string; valueItems: string[]; valueLine: string;
  faq: [string, string][]; source: string; sourceLabel: string;
  scenario: string; steps: string[]; feature: string;
}> = {
  "adicional-periculosidade": {
    headline: "Meu adicional veio certo?",
    searchTitle: "Como conferir o adicional de periculosidade no holerite",
    searchDescription: "Recebe adicional de periculosidade? Veja um holerite fictício, entenda o que conferir na base de cálculo e conheça o guia com simulador e horas extras.",
    sampleRows: [["Salário-base do exemplo", "R$ 2.500,00"], ["Percentual usado neste exemplo", "30%"], ["Adicional de periculosidade", "R$ 750,00"]],
    valueItems: ["Um modelo de holerite comentado para localizar o adicional e entender de onde vem o número.", "Uma calculadora para simular o adicional e comparar o efeito nas horas extras.", "Um roteiro em cinco passos para conferir o pagamento e preparar sua conversa com o departamento pessoal."],
    valueLine: "Em vez de juntar uma calculadora, um vídeo e vários artigos, você tem um passo a passo para sair do número no holerite com perguntas específicas sobre o seu pagamento.",
    sampleNote: "Nesta situação fictícia, a base usada é R$ 2.500,00. Antes de comparar com o seu holerite, confira qual base a folha usou e se você está olhando o mesmo mês. O exemplo não determina quanto você tem direito a receber.",
    faq: [
      ["Como calcular o adicional de periculosidade?", "Na regra geral, aplica-se 30% sobre o salário-base. A sua situação pode ter particularidades. O guia ajuda a identificar o que você usou na simulação e o que a folha considerou."],
      ["O adicional entra nas horas extras?", "Pela Súmula 132 do TST, o adicional pago em caráter permanente entra no cálculo das horas extras. O Volume 1 permite comparar cenários na calculadora e mostra onde olhar antes de concluir que há diferença."],
      ["Trabalho com eletricidade e não recebo. Tenho direito?", "O cargo sozinho não responde. O enquadramento depende das atividades e condições de trabalho. O guia ajuda você a entender o que perguntar, mas não substitui a avaliação técnica ou jurídica do seu caso."],
    ],
    source: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/perguntas-frequentes",
    sourceLabel: "Perguntas frequentes do Ministério do Trabalho e Emprego",
    intro: "Se você trabalha em uma atividade de risco, já deve ter se perguntado se o adicional se aplica ao seu caso ou se o valor no holerite está certo. Este e-book ajuda você a sair do achismo, com exemplos, uma calculadora e um roteiro para conferir o que recebeu.",
    takeaways: ["Entenda o que vale conferir no seu trabalho", "Simule o adicional e as horas extras", "Compare seu holerite com um exemplo comentado"],
    scenario: "O adicional apareceu no holerite, mas você não sabe de onde saiu aquele valor. Por onde começar?",
    steps: ["Localize a linha do adicional no contracheque.", "Use o exemplo do e-book para entender de onde vem o valor.", "Simule o cálculo e anote o que ainda precisa esclarecer."],
    feature: "Não é só um texto para ler. É um guia para abrir ao lado do holerite.",
  },
  "adicional-insalubridade": {
    headline: "Por que meu adicional veio nesse grau?",
    searchTitle: "Adicional de insalubridade: como conferir o grau e o holerite",
    searchDescription: "Seu holerite mostra adicional de insalubridade? Entenda o que conferir sobre o grau, a base de cálculo e o valor lançado, com um exemplo comentado.",
    sampleRows: [["Rubrica fictícia", "Adic. insalubridade"], ["Grau informado no exemplo", "Médio (20%)"], ["Informação que falta para conferir o valor", "Base de cálculo"]],
    valueItems: ["Uma explicação simples do que é avaliado na exposição no trabalho.", "Um guia para distinguir os graus mínimo, médio e máximo, sem confundir grau com base de cálculo.", "Orientações para localizar o adicional e saber o que pedir ao departamento pessoal quando faltam informações."],
    valueLine: "Você separa o que já aparece no holerite do que ainda precisa confirmar. Assim não depende de chutar o grau ou comparar só o valor pago a um colega.",
    sampleNote: "Ver 20% não basta para descobrir o valor esperado. São duas perguntas diferentes: qual grau foi reconhecido e sobre qual base o percentual foi aplicado?",
    faq: [
      ["Como saber se o grau é mínimo, médio ou máximo?", "O holerite mostra o que foi lançado. O enquadramento depende das condições reais de exposição e da avaliação técnica segundo a NR-15. O guia ajuda a separar essas duas informações."],
      ["Como conferir o cálculo do adicional de insalubridade?", "Separe a rubrica do holerite, o percentual aplicado e a base usada na folha. Se ela não estiver clara, peça ao departamento pessoal que indique qual base foi utilizada e por quê."],
      ["Se meu colega recebe mais, meu adicional está errado?", "Não dá para concluir só comparando dois contracheques. Comece verificando se a exposição, o grau reconhecido e a base usada são comparáveis."],
    ],
    source: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadoras/normas-regulamentadoras-vigentes/norma-regulamentadora-no-15-nr-15",
    sourceLabel: "NR-15 no Ministério do Trabalho e Emprego",
    intro: "Quem trabalha exposto a agentes nocivos nem sempre entende o que foi considerado na hora de definir o adicional. Este volume foi pensado para ajudar você a entender os critérios, distinguir os graus e saber o que olhar no contracheque.",
    takeaways: ["Entenda por que a exposição no trabalho importa", "Veja o que distingue os graus mínimo, médio e máximo", "Saiba onde olhar no holerite e o que perguntar"],
    scenario: "Você e um colega fazem tarefas parecidas, mas o adicional não é igual. O que vale conferir antes de tirar uma conclusão?",
    steps: ["Identifique o tipo de exposição na sua rotina.", "Confira se há informação sobre o grau e como ele foi definido.", "Localize a verba no holerite e anote o que precisa ser esclarecido."],
    feature: "Entenda o que você precisa conferir antes de comparar seu caso com o de outra pessoa.",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = getCatalogProductBySlug(slug);
  const copy = salesCopy[slug];
  return product
    ? { title: `${copy?.searchTitle ?? product.titulo} | Honestamente Itamar`, description: copy?.searchDescription ?? product.descricaoCurta }
    : { title: "E-book não encontrado | Honestamente Itamar" };
}

export default async function LivroPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getCatalogProductBySlug(slug);
  if (!product) notFound();

  const canBuy = Boolean(await getCheckoutProduct(slug));
  const copy = salesCopy[slug];

  return (
    <main>
      <section style={{ background: "var(--sand)" }}>
        <div className="container livro-hero" style={{ padding: "48px 20px 56px" }}>
          <div>
            <span className="label">{product.serie}</span>
            <h1
              className="font-display"
              style={{ fontSize: "clamp(2rem, 4vw, 2.9rem)", lineHeight: 1.1, margin: "16px 0 14px", color: "var(--navy)" }}
            >
              {copy?.headline ?? `${product.titulo}: ${product.subtitulo}`}
            </h1>
            <p className="ebook-sales-product">{product.titulo} <span>· E-book digital</span></p>
            <p className="ebook-sales-intro">{copy?.intro ?? product.descricaoCurta}</p>
            {copy && <ul className="ebook-sales-benefits">
              {copy.takeaways.map(item => <li key={item}>{item}</li>)}
            </ul>}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
              {canBuy ? (
                <Link href="#comprar" className="btn btn-primary">
                  Quero conferir meu adicional · {formatMoney(product.precoCentavos)}
                </Link>
              ) : (
                <a className="btn btn-primary" href={copy ? "#investimento" : "#recursos"}>Veja o que você leva por {formatMoney(product.precoCentavos)}</a>
              )}
              <span style={{ fontSize: "0.86rem", color: "var(--muted)" }}>
                {canBuy ? "Acesso liberado após confirmação do pagamento via Pix" : `Vendas em breve · ${formatMoney(product.precoCentavos)}`}
              </span>
            </div>
            {copy && <a className="ebook-soft-link" href="#na-pratica">Ver exemplo de holerite ↓</a>}
          </div>
          <div style={{ position: "relative" }}>
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: "-10%",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(12,102,97,0.14), transparent 70%)",
                zIndex: 0,
              }}
            />
            <div className="livro-hero-cover" style={{ position: "relative", zIndex: 1 }}>
              <BookCover serie={product.serie} titulo={product.titulo} titleSize="1.6rem" />
            </div>
          </div>
        </div>
      </section>

      {copy && <section id="na-pratica" aria-labelledby="na-pratica-titulo" className="container ebook-sales-preview">
        <div>
          <span className="label">Uma situação do dia a dia</span>
          <h2 id="na-pratica-titulo">{copy.scenario}</h2>
          <p>{copy.feature}</p>
          <ol style={{ marginTop: 16 }}>
            {copy.steps.map((step, index) => (
              <li key={step}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{step}</li>
            ))}
          </ol>
        </div>
        <div className="ebook-example">
          <h3>Holerite fictício, linha por linha</h3>
          <dl>{copy.sampleRows.map(([label, value]) => (
            <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
          ))}</dl>
          <p>{copy.sampleNote}</p>
        </div>
      </section>}

      <section id="recursos" className="container" style={{ padding: "48px 20px 56px" }}>
        <h2 className="font-display" style={{ fontSize: "1.5rem", marginBottom: 24, color: "var(--navy)" }}>
          O que você vai encontrar neste volume
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 18,
          }}
        >
          {product.recursos.map((item) => {
            const Icon = ICONS[item.icon];
            return (
              <div key={item.titulo} className="card" style={{ padding: 20 }}>
                <div className="icon-badge" style={{ marginBottom: 14 }}>
                  <Icon size={20} />
                </div>
                <strong style={{ display: "block", marginBottom: 6 }}>{item.titulo}</strong>
                <span style={{ color: "var(--muted)", fontSize: "0.92rem", lineHeight: 1.5 }}>{item.texto}</span>
              </div>
            );
          })}
        </div>
      </section>

      {copy && <div className="container ebook-value-shell">
        <section id="investimento" className="ebook-value" aria-labelledby="ebook-value-title">
          <div>
            <span className="label">E-book digital · Pagamento único</span>
            <h2 id="ebook-value-title">O que você leva por {formatMoney(product.precoCentavos)}?</h2>
            <p>{copy.valueLine}</p>
            <p className="ebook-value-price"><span>De <s>R$ 147</s> por</span> {formatMoney(product.precoCentavos)}</p>
            {canBuy ? <Link className="btn btn-primary" href="#comprar">Quero o guia por {formatMoney(product.precoCentavos)}</Link> : <p className="ebook-availability">Vendas em breve. O exemplo pode ser consultado agora, sem cadastro.</p>}
          </div>
          <ul>{copy.valueItems.map(item => <li key={item}>{item}</li>)}</ul>
        </section>
      </div>}

      <section className="container ebook-next" aria-labelledby="ebook-next-title">
        <span className="label">Próximos passos</span>
        <h2 id="ebook-next-title" className="font-display">A conta não bateu. A quem recorrer?</h2>
        <ol>
          <li><strong>Comece pelo departamento pessoal.</strong> Anote o mês e o valor lançado. Peça a base de cálculo, o percentual e uma explicação do lançamento. No caso da insalubridade, pergunte também como o grau foi identificado.</li>
          <li><strong>Se a dúvida continuar, busque orientação.</strong> O sindicato da sua categoria ou um profissional de direito do trabalho pode orientar sobre o seu caso. Guarde holerites e respostas sem expor seus dados em redes sociais.</li>
          <li><strong>Para falar com o Ministério do Trabalho:</strong> o <a href="tel:158">Alô Trabalho (158)</a> informa sobre os serviços. Há também um <a href="https://denuncia.sit.trabalho.gov.br/home">canal oficial para denunciar possíveis irregularidades</a>.</li>
        </ol>
        {copy && <a className="ebook-soft-link" href={canBuy ? "#comprar" : "#investimento"}>{canBuy ? "Quero o guia para conferir meu holerite" : "Rever o que está incluído no guia"} ↑</a>}
      </section>

      {copy && <section className="container ebook-faq" aria-labelledby="ebook-faq-title">
        <h2 id="ebook-faq-title" className="font-display">Dúvidas de quem está conferindo o holerite</h2>
        {copy.faq.map(([question, answer]) => (
          <details key={question}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
        <p className="ebook-source">Referência para consulta: <a href={copy.source}>{copy.sourceLabel}</a>{slug === "adicional-periculosidade" && <> · <a href="https://www.tst.jus.br/documents/10157/63003/Livro-Internet.pdf">Súmula 132 do TST</a></>}.</p>
      </section>}

      {canBuy && <section id="comprar" aria-labelledby="comprar-titulo" className="container" style={{ padding: "0 20px 64px", scrollMarginTop: 92 }}>
        <div className="card" style={{ padding: 28, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <span className="label">Acesso individual · Pagamento único</span>
            <h2 id="comprar-titulo" className="font-display" style={{ margin: "10px 0 6px", color: "var(--navy)" }}>
              Acesse o e-book por {formatMoney(product.precoCentavos)}
            </h2>
            <p style={{ color: "var(--muted)", maxWidth: 520 }}>
              Você faz seu cadastro e paga com o QR Code Pix gerado na hora. Assim que o
              pagamento é confirmado, seu acesso individual é liberado automaticamente.
            </p>
          </div>
          <ComprarForm produto={product.slug} />
        </div>
      </section>}

      {copy && <div className="container ebook-sales-note">
        <p>Material educativo. O e-book ajuda a entender quais pontos conferir, mas não determina se o adicional é devido em um caso específico.</p>
      </div>}

      <div className="container author-book-shell"><AuthorProfile variant="book" /></div>

      <footer className="ebook-footer">
        <div className="container ebook-footer-inner">
          <div><strong>Honestamente, Itamar.</strong><p>Guias digitais para entender o que aparece no seu holerite.</p></div>
          <nav aria-label="Links do rodapé">
            <Link href="/#biblioteca">Biblioteca</Link>
            <Link href="/acessar">Acesso do leitor</Link>
            <a href="#investimento">O que está incluído</a>
            <a href="https://www.gov.br/trabalho-e-emprego/pt-br/noticias-e-conteudo/2026/julho/saiba-como-acessar-os-canais-de-atendimento-do-ministerio-do-trabalho-e-emprego">Orientação oficial do MTE</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
