# Itamar E-book — Plataforma de Venda

Plataforma própria para vender e entregar a revista digital "Adicional de Periculosidade" com:

- página de vendas (`/`);
- cadastro do comprador (`/comprar`);
- pagamento via Pix dinâmico gerado pelo Asaas, com liberação automática (`/pedido/[id]`);
- painel administrativo para acompanhar pedidos e agir em casos excepcionais (`/admin`);
- acesso individual à revista digital, por link único por comprador (`/ebook/[token]`).

Este é o modelo **2 (Pix dinâmico com confirmação automática via gateway)** descrito em
`docs/resumo-solucao-itamar-2026-09-16.md` — o cliente decidiu evoluir do modelo manual (Pix
CPF com aprovação manual) para este, usando o **Asaas** como gateway de pagamento.

## Fluxo de venda

1. O comprador se cadastra em `/comprar` (nome, e-mail, telefone, estado, CPF).
2. No cadastro, o backend cria/reaproveita um cliente no Asaas e gera uma cobrança Pix
   (`billingType: PIX`). O comprador é levado para `/pedido/[id]`, que mostra o **QR Code**
   e o código **copia e cola**.
3. Assim que o Pix é pago, o Asaas confirma quase instantaneamente e envia um webhook para
   `/api/webhooks/asaas`. O pedido é marcado como **aprovado** e recebe um token de acesso
   individual — tudo automático, sem intervenção da equipe.
4. A página `/pedido/[id]` fica se atualizando sozinha (poll a cada 4s) enquanto aguarda o
   pagamento, e revela o link de acesso (`/ebook/<token>`) assim que o status muda.
5. Se um acesso for compartilhado indevidamente, use **Bloquear acesso** no painel.
   **Reativar acesso** gera um novo token e invalida o anterior.
6. Se o webhook falhar por algum motivo (raro, mas pode acontecer), o pedido fica visível
   como "Aguardando pagamento" no painel e a equipe pode clicar em **Liberar manualmente**
   como fallback.

## Configurando o Asaas

1. Crie uma conta em [asaas.com](https://www.asaas.com) (ou use uma de sandbox para testar
   primeiro em <https://sandbox.asaas.com>).
2. Gere uma chave de API em **Configurações → Integrações → Chaves de API** e coloque em
   `ASAAS_API_KEY`. Defina `ASAAS_ENV=sandbox` para testar ou `ASAAS_ENV=production` quando
   for para valer.
3. Em **Configurações → Integrações → Webhooks**, cadastre uma URL apontando para
   `https://SEU-DOMINIO/api/webhooks/asaas`, evento **Pagamentos**, e defina um **token de
   autenticação**. Coloque esse mesmo token em `ASAAS_WEBHOOK_TOKEN` — é assim que o app
   confirma que o webhook realmente veio do Asaas e não de terceiros.
4. Sem `ASAAS_API_KEY` configurada, o cadastro (`/comprar`) falha ao tentar gerar o Pix. Sem
   `ASAAS_WEBHOOK_TOKEN`, os webhooks são rejeitados (o app nega por padrão em vez de aceitar
   sem verificação).

## Rodando localmente

```bash
npm install
cp .env.example .env
# edite o .env com a senha do painel, a chave de API do Asaas (sandbox) e o token do webhook
npm run dev
```

Acesse `http://localhost:3000`. O painel fica em `http://localhost:3000/admin`. Para testar
o webhook localmente, exponha a porta com uma ferramenta como `ngrok` e cadastre a URL
pública no painel do Asaas.

## Variáveis de ambiente

Veja `.env.example`. As obrigatórias são `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`,
`ASAAS_API_KEY` e `ASAAS_WEBHOOK_TOKEN`. `EBOOK_PRICE_CENTAVOS` deve ser ajustado com o
preço real antes de divulgar a página.

## Dados e armazenamento

Os pedidos ficam em um banco SQLite local (`better-sqlite3`), salvo por padrão em
`./data/itamar-ebook.db` (ignorado pelo git). Como o app grava nesse arquivo, ele precisa
rodar como um processo Node.js de longa duração com disco persistente (VPS, Docker,
Railway, Render, etc. via `npm run build && npm start`) — **não** é compatível, sem
adaptação, com hospedagens serverless "stateless" (ex.: funções edge da Vercel), pois estas
não garantem disco persistente entre execuções nem recebem webhooks de forma confiável sem
configuração adicional. Se for migrar para um desses ambientes no futuro, troque o SQLite
por um banco gerenciado (Postgres, Turso, etc.) — o acesso ao banco está isolado em
`lib/db.ts` e `lib/orders.ts` para facilitar essa troca.

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
- O webhook do Asaas só é aceito com o cabeçalho `asaas-access-token` correto — sem isso,
  qualquer chamada é rejeitada com 401, então ninguém consegue "aprovar" um pedido forjando
  uma notificação.
- Ainda não há limite de dispositivos simultâneos nem expiração automática de sessão —
  ambos estão listados como evolução futura no resumo de solução.

## Próximos passos sugeridos

- Enviar automaticamente o link de acesso por e-mail/WhatsApp assim que o pagamento for
  confirmado (hoje o comprador só vê o link na própria página `/pedido/[id]`).
- Páginas de campanha específicas por anúncio (Meta Ads / Google Ads) com parâmetros de
  rastreamento, conforme `docs/resumo-solucao-itamar-2026-09-16.md`.

## Documentação de referência

A pasta `docs/` reúne o histórico e o material original do projeto: mapas de contexto,
o resumo da solução, o PDF/txt originais enviados pela Erica e a versão de referência da
revista digital.
