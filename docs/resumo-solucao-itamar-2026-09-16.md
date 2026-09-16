# Resumo da Solução — Projeto Itamar E-books

Data: 2026-09-16

## Objetivo

Criar uma revista digital/e-book premium para o Itamar, com visual mais moderno que PDF tradicional, acesso controlado e estrutura preparada para venda.

## Solução recomendada

A solução deve evoluir da senha simples para uma plataforma própria com:

- página de vendas do e-book;
- cadastro do comprador;
- pagamento via Pix;
- liberação de acesso individual;
- painel administrativo com compradores e status de pagamento;
- revista digital protegida, com leitura responsiva no celular e desktop.

## Sobre o Pix

Se o cliente quiser receber diretamente em uma chave Pix CPF, é possível operar em modelo manual:

- comprador preenche cadastro;
- faz Pix para a chave informada;
- envia comprovante;
- a equipe aprova o acesso no painel.

Esse modelo é mais simples para lançar rápido, mas não confirma automaticamente o pagamento nem garante com segurança quem pagou.

Para liberação automática, rastreio mais seguro e controle profissional, o ideal é usar Pix dinâmico por uma conta, banco ou provedor com API. Nesse formato, o site gera QR Code Pix para cada comprador, recebe a confirmação do pagamento e libera o acesso automaticamente.

## Controle contra compartilhamento de senha

Senha única não é ideal para venda, porque pode ser repassada. O controle correto é por acesso individual:

- cada comprador tem acesso próprio;
- o painel mostra nome, e-mail, telefone, estado, data da compra e status;
- o acesso pode ser bloqueado se houver compartilhamento indevido;
- futuramente pode incluir limite de dispositivos ou expiração de sessão.

## Divulgação

Para divulgar cada e-book, a recomendação é criar uma página/campanha específica por produto e rodar anúncios com rastreamento:

- Meta Ads para Instagram e Facebook;
- Google Ads quando houver busca ativa pelo tema;
- links rastreáveis por campanha, criativo e produto.

Assim é possível entender qual e-book, anúncio e público estão gerando mais vendas.

## Estado atual do projeto

Já existe uma versão de revista digital para o e-book de Adicional de Periculosidade, baseada no PDF enviado pela Erica, com:

- tela de acesso;
- capítulos navegáveis;
- busca;
- barra de progresso;
- calculadora simples;
- tabela responsiva;
- leitura adaptada para celular;
- remoção do CPF/PIX da capa original na versão web, para evitar exposição pública de dado sensível.

## Próximo passo sugerido

Definir com o Itamar qual modelo de venda será usado:

1. Pix CPF com aprovação manual, para lançar rápido.
2. Pix dinâmico com integração bancária/API, para operação profissional e automática.

Depois disso, ajustar o projeto atual para incluir página de venda, cadastro, painel e liberação de acesso conforme o modelo escolhido.
