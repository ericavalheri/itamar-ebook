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
        {variant === "book" && <p>Atua na representação dos profissionais da Administração e assina materiais sobre direitos trabalhistas e previdenciários.</p>}
      </div>
    </section>
  );
}
