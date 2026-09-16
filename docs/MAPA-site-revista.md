# MAPA — Site Revista Digital Itamar

Mini site hospedavel da previa em HTML da revista digital do e-book do Itamar.

## Estrutura

- `.openai/hosting.json` — vinculo com o projeto no Sites. Nao salvar tokens aqui.
- `app/page.jsx` — rota inicial que abre a revista.
- `public/revista.html` — HTML estatico da revista digital.
- `package.json` — dependencias minimas para build/publicacao.

## Publicacao

- Projeto Sites: `appgprj_6a8f107d45ec81919160361edc75a41a`.
- Slug: `revista-digital-itamar`.
- Conteudo atual: revista digital v2 baseada no PDF `MONTAR_EBOOK_ADICIONAL_DE_PERICULOSIDADE_ITAMAR`, com acesso por senha simples no worker, conteúdo editorializado, calculadora de periculosidade, busca, navegação por capítulos e aviso educativo/jurídico.
- O CPF/PIX que aparecia na capa do PDF original não foi incluído na versão web para evitar exposição desnecessária de dado sensível.
- Variável esperada no ambiente do Sites: `ITAMAR_EBOOK_PASSWORD` marcada como segredo.
