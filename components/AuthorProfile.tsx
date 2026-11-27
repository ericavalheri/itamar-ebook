export default function AuthorProfile({ variant }: { variant: "footer" | "book" }) {
  const headingId = "author-" + variant + "-title";
  return (
    <section className={"author-profile author-profile--" + variant} aria-labelledby={headingId}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/media/itamar-revoredo-kunert.webp" width={320} height={400} loading="lazy" decoding="async" alt="Retrato de Itamar Revoredo Kunert" />
      <div>
        <p className="author-profile__label">Sobre o autor</p>
        <h2 id={headingId}>Itamar Revoredo Kunert</h2>
        <p>Administrador e autor da coleção Honestamente Itamar.</p>
        {variant === "book" && <>
          <p>Itamar atua na representação e na valorização profissional de administradores e tecnólogos, com trajetória na FEBRAD e no SINASA. Idealizou um curso de perícia judicial para administradores, promovido pelas duas entidades.</p>
          <p>A proposta da coleção é aproximar as regras trabalhistas de situações concretas: abrir o holerite, entender o que foi lançado e saber quais perguntas fazer quando a conta não estiver clara.</p>
          <p><a href="https://csb.org.br/noticias/curso-de-pericia-judicial-para-administradores-amplia-o-campo-de-atuacao-da-categoria">Conheça a iniciativa de formação da FEBRAD e do SINASA</a></p>
        </>}
      </div>
    </section>
  );
}
