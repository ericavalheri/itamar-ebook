export default function BookCover({
  serie,
  titulo,
  aspectRatio = "3 / 4",
  titleSize = "1.3rem",
}: {
  serie: string;
  titulo: string;
  aspectRatio?: string;
  titleSize?: string;
}) {
  const volume = titulo === "Adicional de Periculosidade" ? "01"
    : titulo === "Adicional de Insalubridade" ? "02" : null;
  if (volume) {
    return (
      <div className="book-cover" style={{ aspectRatio }}>
        <img
          src={`/media/itamar-com-autor-volume-${volume}.webp`}
          width={900}
          height={1200}
          alt={`${titulo}. Volume ${volume}. Autor: Itamar Revoredo Kunert.`}
          style={{ display: "block", width: "100%", height: "100%", position: "absolute", inset: 0, objectFit: "contain" }}
        />
      </div>
    );
  }

  return (
    <div
      className={`book-cover${titulo === "Adicional de Periculosidade" ? " book-cover-periculosidade" : ""}`}
      style={{ aspectRatio }}
    >
      <div className="book-cover-content">
        <span className="book-cover-serie">{serie}</span>
        <div>
          <div className="book-cover-rule" />
          <h3 className="book-cover-titulo" style={{ fontSize: titleSize, margin: 0 }}>
            {titulo}
          </h3>
        </div>
      </div>
    </div>
  );
}
