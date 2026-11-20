# Itamar E-book — Plataforma de Venda

Plataforma própria para vender e entregar e-books em formato de revista digital, pensada
como uma **biblioteca**: hoje tem um título ("Adicional de Periculosidade"), mas a estrutura
já suporta vários e-books à venda ao mesmo tempo. Inclui:

- biblioteca/catálogo (`/`) com uma página de vendas por título (`/livros/[slug]`);
- cadastro do comprador por e-book (`/comprar/[slug]`);
- pagamento via Pix dinâmico gerado pelo Asaas, com liberação automática (`/pedido/[id]`);
- painel administrativo para acompanhar pedidos, agir em casos excepcionais, e **liberar
  acesso manualmente sem depender do Asaas** (`/admin`);
- acesso à revista digital por e-mail + código de 6 dígitos, com uma única sessão ativa por
  vez — logar em outro lugar derruba a sessão anterior (`/acessar` e `/ler`).

Este é o modelo **2 (Pix dinâmico com confirmação automática via gateway)** descrito em
`docs/resumo-solucao-itamar-2026-09-16.md` — o cliente decidiu evoluir do modelo manual (Pix
CPF com aprovação manual) para este, usando o **Asaas** como gateway de pagamento.

## A biblioteca de e-books

Os títulos à venda ficam listados em `lib/products.ts` — cada entrada tem um `slug`, preço,
descrição e o arquivo HTML em `content/` com o conteúdo da revista digital. A home (`/`)
lista todos como uma biblioteca; `/livros/[slug]` é a página de vendas de cada um;
`/comprar/[slug]` é o cadastro+checkout daquele título específico; e o pedido guarda qual
produto foi comprado (`orders.produto`), usado depois para liberar o e-book certo em `/ler`.

**Para publicar um novo e-book**: adicione uma entrada em `lib/products.ts` e o arquivo HTML
correspondente em `content/`. Não precisa mexer em mais nada — cadastro, Pix, painel e leitor
já funcionam para qualquer título da lista.

## Fluxo de venda

1. O comprador se cadastra em `/comprar/[slug]` (nome, e-mail, telefone, estado, CPF).
2. No cadastro, o backend cria/reaproveita um cliente no Asaas e gera uma cobrança Pix
   (`billingType: PIX`) no valor daquele título específico. O comprador é levado para
   `/pedido/[id]`, que mostra o **QR Code** e o código **copia e cola**.
3. Assim que o Pix é pago, o Asaas confirma quase instantaneamente e envia um webhook para
   `/api/webhooks/asaas`. O pedido é marcado como **aprovado** e recebe um token de acesso
   individual — tudo automático, sem intervenção da equipe.
4. A página `/pedido/[id]` fica se atualizando sozinha (poll a cada 4s) enquanto aguarda o
   pagamento, e assim que o status muda mostra um botão para ir até `/acessar`.
5. Em `/acessar`, o comprador digita o e-mail usado na compra. Se houver um pedido aprovado
   para esse e-mail, chega um código de 6 dígitos por e-mail (enviado por SMTP, usando uma
   caixa de e-mail da própria Hostinger), válido por 10 minutos. Ao digitar o código certo,
   uma sessão é criada (cookie de 30 dias) e ele é levado para `/ler`.
6. Só existe **uma sessão ativa por comprador**. Se ele (ou alguém com quem compartilhou o
   e-mail e o código) fizer login de novo em outro aparelho, a sessão antiga é substituída
   na hora — a página `/ler` verifica isso a cada 20s e redireciona para `/acessar` com um
   aviso assim que percebe que não é mais a sessão válida.
7. Se um acesso for indevido, use **Bloquear acesso** no painel — isso também encerra a
   sessão ativa na hora. Dá pra **encerrar a sessão** sem bloquear a compra (ex.: comprador
   trocou de celular e não consegue entrar), ou **reativar** um pedido bloqueado/expirado.
8. Se o webhook do Asaas falhar por algum motivo (raro, mas pode acontecer), o pedido fica
   visível como "Aguardando pagamento" no painel e a equipe pode clicar em **Liberar
   manualmente** como fallback.
9. **Enquanto não temos a conta Asaas do cliente configurada**, o cadastro público
   (`/comprar/[slug]`) não funciona, porque depende da API do Asaas para gerar o Pix. Nesse
   meio tempo, o painel tem o botão **"+ Adicionar comprador manualmente"**: a equipe recebe
   o pagamento por fora (Pix direto, combinado por WhatsApp etc.) e cadastra o comprador ali
   — nome, e-mail e qual e-book, o resto é opcional. O pedido entra direto como **aprovado**,
   sem tocar no Asaas, e o comprador já consegue logar normalmente em `/acessar` com aquele
   e-mail. É a mesma lógica usada pelo botão "Liberar manualmente".

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

## Configurando o envio de e-mail (SMTP da Hostinger)

O código de acesso de 6 dígitos é enviado por SMTP, usando uma caixa de e-mail criada na
própria hospedagem (ex.: `acesso@honestamenteitamar.com.br`), em vez de um provedor de
e-mail transacional separado.

1. No hPanel, crie a caixa em **E-mails → Contas de e-mail** (ex.: `acesso@SEU-DOMINIO`).
2. Ainda no hPanel, a própria tela da conta de e-mail mostra os dados de **"Configurar
   cliente de e-mail" / "Mail client configuration"** — é de lá que saem os valores exatos
   de `SMTP_HOST` e `SMTP_PORT` (variam conforme o produto de e-mail do plano de hospedagem).
   Normalmente a porta 465 usa conexão já criptografada (`secure: true`, tratado
   automaticamente pelo código) — se o painel indicar outra porta (ex.: 587), ajuste
   `SMTP_PORT` de acordo.
3. `SMTP_USER` e `SMTP_PASSWORD` são o e-mail completo e a senha dessa caixa.
4. `SMTP_FROM` é o remetente que o comprador vê — pode ser só o e-mail ou
   `"Honestamente, Itamar <acesso@SEU-DOMINIO>"`.
5. Sem essas variáveis configuradas, o pedido de código falha silenciosamente (o comprador
   não recebe e-mail, mas a resposta na tela continua genérica por segurança) — configure
   antes de divulgar, e veja os logs de execução da aplicação no hPanel se precisar
   diagnosticar uma falha de envio (erro de autenticação, limite de envio da caixa, etc.).

**Atenção a limites de envio**: caixas de e-mail de hospedagem costumam ter limites de envio
por hora/dia bem mais baixos que um serviço de e-mail transacional dedicado, e esse código
expira em 10 minutos — se o volume de vendas crescer e os e-mails começarem a atrasar ou
cair em spam, considere migrar para um serviço como Resend ou Amazon SES (só trocar
`lib/email.ts`, o resto do fluxo não muda).

## Rodando localmente

```bash
npm install
cp .env.example .env
# edite o .env com a senha do painel, a chave de API do Asaas (sandbox), o token do webhook
# e os dados SMTP da caixa de e-mail
npm run dev
```

Acesse `http://localhost:3000`. O painel fica em `http://localhost:3000/admin`. Para testar
o webhook localmente, exponha a porta com uma ferramenta como `ngrok` e cadastre a URL
pública no painel do Asaas.

## Deploy no Hostinger (hPanel → Node.js App)

O projeto roda como um processo Node.js de longa duração (por causa do SQLite e do
webhook), então precisa da funcionalidade **Node.js App** do hPanel (planos Business/Cloud
da Hostinger), não hospedagem PHP simples.

1. **hPanel → Avançado → Node.js → Criar aplicação**:
   - Versão do Node: 20.x (ou a mais recente disponível).
   - Raiz da aplicação: a pasta onde o projeto vai ficar (ex.: `itamar-ebook`).
   - URL da aplicação: `honestamenteitamar.com.br`.
   - Arquivo de inicialização (`startup file`): `server.js` — esse arquivo já está pronto no
     repo, ele escuta na porta que o Passenger/hPanel define via `process.env.PORT`
     (diferente de `next start`, que não respeita isso da mesma forma).
2. **Levar o código para a pasta da aplicação**: pela aba **Git** do painel Node.js
   (aponte para `https://github.com/ericavalheri/itamar-ebook`, branch
   `claude/itamar-ebooks-sales-platform-n34b48` ou a branch que for usar em produção), ou via
   FTP/File Manager se preferir enviar os arquivos manualmente.
3. **Variáveis de ambiente**: no painel Node.js tem uma seção de variáveis — preencha com os
   mesmos nomes do `.env.example` (`ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `ASAAS_API_KEY`,
   `ASAAS_ENV=production`, `ASAAS_WEBHOOK_TOKEN`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
   `SMTP_PASSWORD`, `SMTP_FROM`), com valores reais — nunca os de teste usados durante o
   desenvolvimento.
4. **Instalar dependências**: use o botão "Executar comando NPM install" do painel (ou, se
   tiver acesso SSH, `npm install` manualmente na pasta da aplicação).
5. **Banco de dados persistente**: por padrão o SQLite é salvo em `./data/` dentro da pasta
   do projeto. Se cada deploy/git pull recriar essa pasta, os pedidos gravados se perdem.
   Para evitar isso, defina `DATA_DIR` apontando para um caminho **fora** da pasta do
   projeto (ex.: `/home/SEU-USUARIO/dados-itamar-ebook`), criado manualmente uma vez, fora
   do controle do Git.
6. **Rodar o build e reiniciar**: rode `npm run build` (pelo terminal SSH, se disponível, ou
   configure como parte do processo de deploy do painel) e reinicie a aplicação Node.js pelo
   hPanel.
7. **Webhook do Asaas**: depois que o site estiver acessível em
   `https://honestamenteitamar.com.br`, cadastre no Asaas a URL
   `https://honestamenteitamar.com.br/api/webhooks/asaas` como descrito em
   "Configurando o Asaas" acima.

Se o `npm install` falhar tentando compilar o `better-sqlite3` (módulo nativo — alguns
planos de hospedagem compartilhada não têm as ferramentas de compilação necessárias), me
avise: nesse caso trocamos o SQLite por uma alternativa sem compilação nativa.

## Variáveis de ambiente

Veja `.env.example`. As obrigatórias são `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`,
`ASAAS_API_KEY` e `ASAAS_WEBHOOK_TOKEN` (para a venda automática) e `SMTP_HOST`/`SMTP_USER`/
`SMTP_PASSWORD` (para o login por e-mail funcionar). Preço não é mais uma variável de
ambiente — cada e-book tem o seu, definido em `lib/products.ts`.

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
sessão feita em `app/ler/route.ts`. Layout, calculadora, busca e navegação por capítulos
foram preservados.

## Segurança do acesso

- O login usa e-mail + código de 6 dígitos (hash guardado no banco, nunca o código em
  texto puro), válido por 10 minutos, com limite de 5 tentativas erradas por código e
  limite de pedidos de código por e-mail (evita força bruta e spam de e-mails).
- Só existe uma sessão ativa por comprador: fazer login em outro lugar substitui a sessão
  anterior na hora, e a leitura em andamento detecta isso em até 20 segundos e pede login
  de novo — é o mecanismo contra compartilhamento de acesso.
- O painel permite bloquear (revoga a compra e encerra a sessão), encerrar sessão (sem
  bloquear a compra) e reativar acesso de qualquer comprador.
- O webhook do Asaas só é aceito com o cabeçalho `asaas-access-token` correto — sem isso,
  qualquer chamada é rejeitada com 401, então ninguém consegue "aprovar" um pedido forjando
  uma notificação.

## Próximos passos sugeridos

- Páginas de campanha específicas por anúncio (Meta Ads / Google Ads) com parâmetros de
  rastreamento, conforme `docs/resumo-solucao-itamar-2026-09-16.md`.
- Se o volume de vendas crescer e o envio por SMTP da Hostinger começar a atrasar ou cair em
  spam, considere migrar `lib/email.ts` para um serviço de e-mail transacional dedicado
  (Resend, Amazon SES, etc.).

## Documentação de referência

A pasta `docs/` reúne o histórico e o material original do projeto: mapas de contexto,
o resumo da solução, o PDF/txt originais enviados pela Erica e a versão de referência da
revista digital.

## Prévia pública segura (pré-lançamento)

`SALES_ENABLED` fica desativado por padrão. Sem `SALES_ENABLED=true` e as configurações
obrigatórias, a biblioteca e os detalhes dos livros ficam públicos, com aviso de prévia;
os botões de compra e o formulário de CPF não aparecem. POST `/api/orders` retorna 503
antes de ler dados pessoais ou chamar o Asaas. Admin e leitura continuam protegidos.

Para abrir vendas, validar primeiro: Asaas e webhook, domínio/remetente do Resend,
segredos do painel, `DATA_DIR` fora do deploy (persistência e backup testados), fluxo de
pagamento e acesso. Só depois configurar `SALES_ENABLED=true`. A flag não substitui a
validação da infraestrutura e não confirma que as chaves são válidas.
