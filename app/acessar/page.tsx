import AcessarForm from "./AcessarForm";

export default async function AcessarPage({
  searchParams,
}: {
  searchParams: Promise<{ encerrado?: string }>;
}) {
  const { encerrado } = await searchParams;

  return (
    <main className="container" style={{ padding: "48px 20px 80px" }}>
      <span className="label">Acesso à revista digital</span>
      <h1 style={{ margin: "12px 0 6px" }}>Adicional de Periculosidade</h1>
      <p style={{ color: "var(--muted)", marginBottom: 20, maxWidth: 480 }}>
        Informe o e-mail usado na compra. Vamos te enviar um código de 6 dígitos, válido por
        10 minutos, para confirmar que é você.
      </p>
      {encerrado && (
        <div
          className="card"
          style={{
            padding: "14px 18px",
            marginBottom: 20,
            maxWidth: 400,
            borderColor: "var(--danger)",
            fontSize: "0.9rem",
          }}
        >
          Esse acesso foi aberto em outro lugar, então essa sessão foi encerrada. Faça login
          de novo abaixo.
        </div>
      )}
      <AcessarForm />
    </main>
  );
}
