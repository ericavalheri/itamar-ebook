import LoginForm from "./LoginForm";

export default function AdminLoginPage() {
  return (
    <main className="container" style={{ padding: "80px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <span className="label">Painel administrativo</span>
        <h1 style={{ margin: "12px 0 0" }}>Itamar E-book</h1>
      </div>
      <LoginForm />
    </main>
  );
}
