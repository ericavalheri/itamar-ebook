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
  if (titulo === "Adicional de Insalubridade") {
    return (
      <div
        className="book-cover"
        style={{
          aspectRatio,
          background: "linear-gradient(145deg, #172536 0%, #164542 61%, #0a282d 100%)",
          color: "#fff8e7",
        }}
      >
        <div style={{ position: "absolute", inset: "4%", border: "1px solid rgb(230 196 106 / 33%)", pointerEvents: "none" }} aria-hidden="true" />
        <div
          style={{
            position: "relative", zIndex: 1, display: "grid", gridTemplateRows: "auto minmax(0, 1fr) auto",
            padding: "9% 10% 10% 12%", height: "100%", minHeight: 0, gap: "4%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4, color: "#f4d382" }}>
            <span style={{ fontSize: "0.58rem", fontWeight: 750, textTransform: "uppercase", letterSpacing: "0.10em", lineHeight: 1.3 }}>{serie.split(" · ")[0]}</span>
            <span style={{ flexShrink: 0, fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.10em", borderBottom: "1px solid #dfb85f", paddingBottom: 2 }}>VOL. 02</span>
          </div>
          <svg aria-hidden="true" focusable="false" viewBox="0 0 208 105" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%", alignSelf: "center" }}>
            <g fill="none">
              <path d="M12 85H196M12 15H196M27 7V95M181 7V95" stroke="#d6c07b" strokeWidth=".65" opacity=".34" />
              <circle cx="104" cy="51" r="42" stroke="#ddc280" opacity=".30" />
              <circle cx="104" cy="51" r="32" stroke="#ddc280" opacity=".30" strokeDasharray="2 3" />
              <path d="M17 60h24l9-13 11 24 11-38 11 27h13l8-10 8 10h13l11-27 11 38 11-24 9 13h24" stroke="#f2cd7a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M104 9v12m0 60v12M62 51h12m60 0h12" stroke="#b9d6b9" opacity=".6" />
            </g>
            <circle cx="104" cy="50" r="3" fill="#fff1c3" />
            <circle cx="27" cy="85" r="1.8" fill="#e9c982" /><circle cx="181" cy="15" r="1.8" fill="#e9c982" />
          </svg>
          <div>
            <div aria-hidden="true" style={{ width: "25%", height: 1, background: "#efcb7a", marginBottom: 7 }} />
            <h3 className="book-cover-titulo" style={{ margin: 0, fontSize: titleSize, lineHeight: 1.12, letterSpacing: "-0.035em", overflowWrap: "anywhere", color: "#fff8e7" }}>{titulo}</h3>
            <p style={{ margin: "5px 0 0", fontSize: "0.58rem", lineHeight: 1.25, color: "#dceadc" }}>Entenda quando se aplica e como conferir o pagamento</p>
            <p style={{ margin: "8px 0 0", fontSize: "0.54rem", letterSpacing: "0.065em", textTransform: "uppercase", lineHeight: 1.15, color: "#f4d382" }}>Itamar Revoredo Kunert</p>
          </div>
        </div>
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
