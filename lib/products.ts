export interface Product {
  slug: string;
  serie: string;
  titulo: string;
  subtitulo: string;
  descricaoCurta: string;
  precoCentavos: number;
  contentFile: string;
  recursos: { titulo: string; texto: string }[];
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
      { titulo: "Base legal explicada", texto: "CLT, NR-16 e súmulas do TST traduzidas em linguagem simples." },
      { titulo: "Calculadora integrada", texto: "Simule o valor do adicional e das horas extras com o seu salário." },
      { titulo: "Modelo de holerite", texto: "Veja como a verba deve aparecer no contracheque, com exemplo real." },
      { titulo: "Roteiro de conferência", texto: "Cinco passos para checar se o pagamento está correto." },
      { titulo: "Leitura por capítulos", texto: "Navegação, busca e progresso de leitura no celular ou no computador." },
      { titulo: "Acesso individual", texto: "Login por e-mail e código, com uma sessão só por vez." },
    ],
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
