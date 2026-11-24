import type { IconName } from "@/components/icons";

export interface Product {
  slug: string;
  serie: string;
  titulo: string;
  subtitulo: string;
  descricaoCurta: string;
  precoCentavos: number;
  contentFile: string;
  recursos: { icon: IconName; titulo: string; texto: string }[];
}

// Biblioteca de e-books à venda. Para colocar um novo título no ar: adicione
// uma entrada aqui com um slug único e o arquivo HTML em content/.
export const PRODUCTS: Product[] = [
  {
    slug: "adicional-periculosidade",
    serie: "Série Verbas Trabalhistas · Volume 01",
    titulo: "Adicional de Periculosidade",
    subtitulo: "Entenda, calcule e confira o seu direito",
    descricaoCurta:
      "Revista digital interativa com base legal, calculadora, exemplos de holerite e um passo a passo para conferir se você está recebendo o valor correto.",
    precoCentavos: 3800,
    contentFile: "adicional-periculosidade.html",
    recursos: [
      { icon: "scale", titulo: "Base legal explicada", texto: "CLT, NR-16 e súmulas do TST traduzidas em linguagem simples." },
      { icon: "calculator", titulo: "Calculadora integrada", texto: "Simule o valor do adicional e das horas extras com o seu salário." },
      { icon: "receipt", titulo: "Modelo de holerite", texto: "Veja como a verba deve aparecer no contracheque, com exemplo real." },
      { icon: "checklist", titulo: "Roteiro de conferência", texto: "Cinco passos para checar se o pagamento está correto." },
      { icon: "book", titulo: "Leitura por capítulos", texto: "Navegação, busca e progresso de leitura no celular ou no computador." },
      { icon: "shield", titulo: "Acesso individual", texto: "Login por e-mail e código, com uma sessão só por vez." },
    ],
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export type CatalogProduct = Omit<Product, "contentFile"> & { catalogOnly?: true };

// Listing metadata only. Unreleased titles must not enter PRODUCTS, the
// order/checkout/admin/reader registry, until their sales and content are ready.
export const CATALOG_PRODUCTS: CatalogProduct[] = [
  ...PRODUCTS.map(({ contentFile: _private, ...listing }) => listing),
  {
    slug: "adicional-insalubridade",
    serie: "Série Verbas Trabalhistas · Volume 02",
    titulo: "Adicional de Insalubridade",
    subtitulo: "Entenda quando se aplica e como conferir o pagamento",
    descricaoCurta: "Conheça os temas do segundo volume: exposição no trabalho, graus de insalubridade e conferência do adicional.",
    precoCentavos: 3800,
    catalogOnly: true,
    recursos: [
      { icon: "scale", titulo: "Critérios", texto: "Exposição a agentes nocivos e enquadramento nas regras aplicáveis." },
      { icon: "calculator", titulo: "Graus e cálculo", texto: "Grau mínimo, médio e máximo e o que observar no cálculo." },
      { icon: "receipt", titulo: "Conferência do pagamento", texto: "Como identificar o adicional no contracheque." },
    ],
  },
];

export function getCatalogProductBySlug(slug: string): CatalogProduct | undefined {
  return CATALOG_PRODUCTS.find((p) => p.slug === slug);
}
