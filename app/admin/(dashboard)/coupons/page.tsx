import Link from "next/link";
import { redirect } from "next/navigation";
import { adminIdentity } from "@/lib/admin-accounts";
import { listCoupons } from "@/lib/coupons";
import styles from "./coupon.module.css";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const notices: Record<string,string> = {
  criado:"Cupom criado.", desativado:"Cupom desativado. Os pedidos já emitidos não mudam.",
  duplicado:"Esse código já existe.", invalido:"Confira código, limites e datas e tente novamente.",
};
const format = new Intl.DateTimeFormat("pt-BR",{timeZone:"America/Sao_Paulo",dateStyle:"short"});
export default async function CouponsPage({searchParams}: {searchParams:Promise<{resultado?:string}>}) {
  // Check at the data access point as well as the dashboard layout.
  const identity = await adminIdentity();
  if (!identity) redirect("/admin/login");
  if (identity.role !== "owner") redirect("/admin");
  const {resultado} = await searchParams;
  const notice = resultado && Object.hasOwn(notices,resultado) ? notices[resultado] : null;
  const rows = listCoupons();
  const now = new Date().toISOString();
  const today = new Intl.DateTimeFormat("sv-SE",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  return (
    <main className={styles.shell}>
      <Link href="/admin" className={styles.back}>← Voltar ao painel</Link>
      <h1>Cupons de desconto</h1>
      <p>Crie um código com percentual, validade e limite de usos. O valor mínimo após aplicar o cupom é R$ 5,00.</p>
      {notice && <p role="status" className={styles.notice}>{notice}</p>}
      <section className={styles.card}>
        <h2>Novo cupom</h2>
        <form className={styles.form} action="/api/admin/coupons" method="post">
          <input type="hidden" name="action" value="criar" />
          <label>Código <input required name="code" minLength={3} maxLength={32} pattern="[A-Za-z0-9][A-Za-z0-9_\\-]{2,31}" placeholder="Ex.: LEITORES10" /></label>
          <label>Desconto (%) <input required type="number" name="percentOff" min={1} max={90} step={1} defaultValue={10} /></label>
          <label>Limite de usos <input required type="number" name="maxUses" min={1} max={10000} step={1} defaultValue={25} /></label>
          <label>Começa em <input required type="date" name="startsOn" defaultValue={today} /></label>
          <label>Válido até <input required type="date" name="endsOn" min={today} /></label>
          <button type="submit">Criar cupom</button>
        </form>
        <p className={styles.note}>Validade até o fim do dia selecionado, no horário de Brasília.</p>
      </section>
      <section className={styles.card}>
        <h2>Cupons recentes</h2>
        <p className={styles.note}>O uso é reservado ao gerar o Pix, mesmo antes do pagamento.</p>
        {rows.length === 0 ? <p>Nenhum cupom cadastrado.</p> : <div className={styles.scroll}><table>
          <thead><tr>{["Código","Desconto","Validade","Usos reservados","Situação","Ação"].map(h=><th key={h} scope="col">{h}</th>)}</tr></thead>
          <tbody>{rows.map(c=><tr key={c.code}>
            <th scope="row">{c.code}</th><td>{c.percent_off}%</td>
            <td>{format.format(new Date(c.starts_at))} a {format.format(new Date(c.ends_at))}</td>
            <td>{c.uses} / {c.max_uses}</td>
            <td>{!c.active ? "Desativado" : now > c.ends_at ? "Vencido" : now < c.starts_at ? "Programado" : c.uses >= c.max_uses ? "Esgotado" : "Ativo"}</td>
            <td>{c.active ? <form method="post" action="/api/admin/coupons">
              <input type="hidden" name="action" value="desativar" />
              <input type="hidden" name="code" value={c.code} />
              <button className={styles.secondary} aria-label={"Desativar "+c.code}>Desativar</button>
            </form> : "Sem ação"}</td>
          </tr>)}</tbody></table></div>}
      </section>
    </main>
  );
}
