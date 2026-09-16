# Itamar E-book — Plataforma de Venda

Plataforma própria para vender e entregar a revista digital "Adicional de Periculosidade" com:

- página de vendas (`/`);
- cadastro do comprador (`/comprar`);
- pagamento via Pix com chave CPF, no modelo manual (`/pedido/[id]`);
- painel administrativo para aprovar pagamentos e liberar acesso (`/admin`);
- acesso individual à revista digital, por link único por comprador (`/ebook/[token]`).

Este é o modelo **1 (Pix CPF com aprovação manual)** descrito em
`docs/resumo-solucao-itamar-2026-09-16.md`, já escolhido para o lançamento. O modelo 2
(Pix dinâmico com confirmação automática via API bancária) fica como evolução futura — a
estrutura de pedidos já foi pensada para não precisar de retrabalho grande quando isso
acontecer.

## Fluxo de venda

1. O comprador se cadastra em `/comprar` (nome, e-mail, telefone, estado).
2. Ele é levado para `/pedido/[id]`, onde vê a chave Pix e o valor a pagar.
3. Depois de pagar, ele descreve o pagamento e/ou anexa o comprovante na própria página.
4. O pedido aparece no painel (`/admin`) como "Aguardando aprovação".
5. A equipe confere o comprovante e clica em **Aprovar**. Isso gera um link de acesso
   individual (`/ebook/<token>`), que deve ser copiado no painel e enviado manualmente ao
   comprador (e-mail/WhatsApp — não há envio automático de e-mail nesta versão).
6. Se um acesso for compartilhado ou precisar ser revogado, use **Bloquear acesso** no
   painel. **Reativar acesso** gera um novo link e invalida o anterior.

## Rodando localmente

```bash
npm install
cp .env.example .env
# edite o .env com a senha do painel, a chave Pix real e o preço do e-book
npm run dev
```

Acesse `http://localhost:3000`. O painel fica em `http://localhost:3000/admin`.

## Variáveis de ambiente

Veja `.env.example`. As obrigatórias para o painel funcionar são `ADMIN_PASSWORD` e
`ADMIN_SESSION_SECRET`. `PIX_KEY`, `PIX_OWNER_NAME` e `EBOOK_PRICE_CENTAVOS` devem ser
ajustadas com os dados reais do Itamar antes de divulgar a página — os valores padrão são
placeholders visíveis na tela de pagamento.

## Dados e armazenamento

Os pedidos ficam em um banco SQLite local (`better-sqlite3`), salvo por padrão em
`./data/itamar-ebook.db` (ignorado pelo git). Como o app grava nesse arquivo, ele precisa
rodar como um processo Node.js de longa duração com disco persistente (VPS, Docker,
Railway, Render, etc. via `npm run build && npm start`) — **não** é compatível, sem
adaptação, com hospedagens serverless "stateless" (ex.: funções edge da Vercel), pois estas
não garantem disco persistente entre execuções. Se for migrar para um desses ambientes no
futuro, troque o SQLite por um banco gerenciado (Postgres, Turso, etc.) — o acesso ao banco
está isolado em `lib/db.ts` e `lib/orders.ts` para facilitar essa troca.

Comprovantes de pagamento (imagem ou PDF, até ~3MB) são guardados como base64 dentro do
próprio banco, o que é adequado para o volume baixo do modelo manual, mas não deve ser
usado em grande escala.

## Conteúdo da revista digital

O conteúdo do e-book (`content/adicional-periculosidade.html`) foi portado da versão HTML
já validada anteriormente para o projeto (ver `docs/revista-digital-itamar-referencia.html`
e `docs/MAPA-site-revista.md`), removendo a tela de senha única em favor da checagem de
token individual feita em `app/ebook/[token]/route.ts`. Layout, calculadora, busca e
navegação por capítulos foram preservados.

## Segurança do acesso individual

- Cada comprador aprovado recebe um token aleatório de 48 caracteres — o link não é
  adivinhável.
- O painel permite bloquear (revogar) e reativar (gerar novo token, invalidando o antigo)
  o acesso de qualquer comprador, para lidar com compartilhamento indevido.
- Ainda não há limite de dispositivos simultâneos nem expiração automática de sessão —
  ambos estão listados como evolução futura no resumo de solução.

## Próximos passos sugeridos

- Enviar automaticamente o link de acesso por e-mail ao aprovar um pedido.
- Migrar para Pix dinâmico com confirmação automática, quando o Itamar decidir evoluir do
  modelo manual.
- Páginas de campanha específicas por anúncio (Meta Ads / Google Ads) com parâmetros de
  rastreamento, conforme `docs/resumo-solucao-itamar-2026-09-16.md`.

## Documentação de referência

A pasta `docs/` reúne o histórico e o material original do projeto: mapas de contexto,
o resumo da solução, o PDF/txt originais enviados pela Erica e a versão de referência da
revista digital.
