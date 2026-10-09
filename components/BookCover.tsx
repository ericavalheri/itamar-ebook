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
  return (
    <div className="book-cover" style={{ aspectRatio }}>
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
