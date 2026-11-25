import Link from "next/link";
import type { adminIdentity, listAdminOrders, listAdminTeam } from "@/lib/admin-accounts";
import { formatMoney, STATUS_LABEL } from "@/lib/money";
import { PRODUCTS } from "@/lib/products";
import type { AdminTab } from "./page";
import AdminLogout from "./AdminLogout";
import ManualOrderForm from "./ManualOrderForm";
import AdminOrderActions from "./AdminOrderActions";
import AdminTeamActions from "./AdminTeamActions";
import s from "../admin-dashboard.module.css";

type Rows = Awaited<ReturnType<typeof listAdminOrders>>;
type Team = Awaited<ReturnType<typeof listAdminTeam>>;
type Identity = NonNullable<Awaited<ReturnType<typeof adminIdentity>>>;
const label = {overview: "Visão geral", orders: "Pedidos", users: "Usuários", money: "Financeiro"};
const intro = {overview:"Acompanhe pedidos, pagamentos e leitura em um só lugar.",orders:"Acompanhe o pagamento e a liberação de cada compra.",users:"Equipe administrativa e leitores têm acessos separados.",money:"Separe valores registrados, cobranças pendentes e repasses."};
const statusKeys = Object.keys(STATUS_LABEL);
const tz = "America/Sao_Paulo";
const dt = new Intl.DateTimeFormat("pt-BR", {dateStyle:"short", timeStyle:"short", timeZone:tz});
const dayName = new Intl.DateTimeFormat("pt-BR", {day:"2-digit",month:"short", timeZone:tz});
const isoDay = new Intl.DateTimeFormat("sv-SE", {year:"numeric",month:"2-digit",day:"2-digit",timeZone:tz});
const count = (n:number, word:string, plural:string) => `${n} ${n === 1 ? word : plural}`;
const href = (tab:AdminTab, filter="", page=1) => tab==="overview" ? "/admin" : "/admin?"+new URLSearchParams({tab,...(filter?{status:filter}:{}),...(page>1?{page:String(page)}:{})}).toString();
const productName = (slug:string) => PRODUCTS.find(p=>p.slug===slug)?.titulo ?? slug;
const kind = (status:Rows[number]["status"])=>status==="aprovado"?s.green:status==="aguardando_pagamento"?s.yellow:s.gray;

function Empty({title,body}:{title:string;body:string}) {return <div className={s.empty}><strong>{title}</strong><p>{body}</p></div>;}
function Metrics({received,pending,total}:{received:Rows;pending:Rows;total:number}) {
  const sum=(rows:Rows)=>rows.reduce((a,o)=>a+o.valor_centavos,0);
  return <div className={s.grid}>
    <article className={s.card}><p className={s.kicker}>Pagamento registrado</p><strong className={s.amount}>{formatMoney(sum(received))}</strong><p>{count(received.length,"pedido","pedidos")} · valor bruto</p></article>
    <article className={s.card}><p className={s.kicker}>Aguardando pagamento</p><strong className={s.amount}>{formatMoney(sum(pending))}</strong><p>{count(pending.length,"cobrança pendente","cobranças pendentes")}</p></article>
    <article className={s.card}><p className={s.kicker}>Pedidos cadastrados</p><strong className={s.amount}>{total}</strong><p>Inclui todos os estados</p></article>
  </div>;
}

export default function AdminDashboard({tab,identity,orders,team,filter,page}:{tab:AdminTab;identity:Identity;orders:Rows;team:Team;filter:string;page:string}) {
  const owner = identity.role === "owner";
  const recorded=orders.filter(order=>order.pago_at !== null && Number.isFinite(Date.parse(order.pago_at ?? "")));
  const pending=orders.filter(order=>order.status==="aguardando_pagamento");
  const activeFilter=statusKeys.includes(filter)?filter:"";
  const filtered=orders.filter(o=>!activeFilter||o.status===activeFilter);
  const last=Math.max(1,Math.ceil(filtered.length/20));
  const cur=Math.min(last,Math.max(1,(/^\d{1,8}$/.test(page)?Number(page):1)));
  const visible=filtered.slice((cur-1)*20,cur*20);
  const sums = new Map<string,{date:Date;total:number}>();
  for(const o of recorded){const date=new Date(o.pago_at!);const key=isoDay.format(date);const existing=sums.get(key);sums.set(key,{date,total:(existing?.total??0)+o.valor_centavos});}
  const days=Array.from(sums.entries()).sort(([a],[b])=>a.localeCompare(b)).slice(-7);
  const max=Math.max(1,...days.map(([,v])=>v.total));
  const buyers=new Map<string,{name:string;books:Set<string>}>();
  if(owner&&tab==="users") for(const o of orders){if(!o.email)continue;const key=o.email.trim().toLowerCase();if(!key)continue;const old=buyers.get(key)??{name:o.nome,books:new Set<string>()};if(o.status==="aprovado")old.books.add(o.produto);buyers.set(key,old);}
  return <div className={s.shell}>
    <a className={s.skip} href="#admin-main">Pular para o conteúdo</a>
    <aside className={s.sidebar}>
      <div className={s.brand}><span>Honestamente, Itamar<span className={s.dot}>.</span></span><small>ADMINISTRAÇÃO DA BIBLIOTECA</small></div>
      <nav className={s.nav} aria-label="Menu da administração">
        {(Object.keys(label) as AdminTab[]).map(id=><Link key={id} href={href(id)} prefetch={false} aria-current={id===tab?"page":undefined}>{label[id]}</Link>)}
        {owner && <Link href="/admin/coupons" prefetch={false}>Cupons</Link>}
      </nav>
      <div className={s.account}><small>{owner?"Administração":"Operação"}</small><span>{identity.email}</span><AdminLogout/></div>
    </aside>
    <div className={s.workspace}><header className={s.top}><span>Painel da biblioteca</span><span className={s.badge}>Área restrita</span></header>
      <main className={s.content} id="admin-main" tabIndex={-1}>
        <header className={s.heading}><p className={s.kicker}>GESTÃO DA BIBLIOTECA</p><h1>{label[tab]}</h1><p>{intro[tab]}</p></header>
        {(tab==="overview"||tab==="money")&&<>
          <Metrics received={recorded} pending={pending} total={orders.length}/>
          <section className={s.card}><h2>Pagamentos registrados por dia</h2><p>Até sete datas com registros, no horário de Brasília. Valores brutos do sistema.</p>
            {days.length ? <ul className={s.chart}>{days.map(([key,v])=><li key={key}><span>{dayName.format(v.date)}</span><div className={s.track} aria-hidden="true"><span style={{width:`${v.total/max*100}%`}}/></div><strong>{formatMoney(v.total)}</strong></li>)}</ul> : <Empty title="Nenhum pagamento registrado" body="Quando houver um pedido com pagamento registrado, os valores aparecerão aqui." />}
          </section>
          {tab==="overview"?<Link prefetch={false} className={s.primary} href={href("orders")}>Abrir pedidos</Link>:<section className={s.card}><h2>Saldo líquido e repasses</h2><p>Os valores acima podem incluir pedidos aprovados manualmente. Não representam saldo liberado pelo Asaas. Taxas, estornos e repasses precisam ser conferidos no provedor.</p></section>}
        </>}
        {tab==="orders"&&<>
          {owner&&<section className={s.card}><h2>Registrar pedido pago fora do site</h2><p>Use apenas depois de confirmar o pagamento. A liberação pode enviar código de acesso ao comprador.</p><ManualOrderForm products={PRODUCTS}/></section>}
          <section className={s.card}>
            <h2>Todos os pedidos</h2>
            <nav className={s.filters} aria-label="Filtrar pedidos">
              <Link href={href("orders")} prefetch={false} aria-current={!activeFilter?"page":undefined}>Todos</Link>
              {statusKeys.map(k=><Link key={k} href={href("orders",k)} prefetch={false} aria-current={k===activeFilter?"page":undefined}>{STATUS_LABEL[k as keyof typeof STATUS_LABEL]}</Link>)}
            </nav>
            <p>{count(filtered.length,"pedido encontrado","pedidos encontrados")}</p>
            {visible.length ? <div className={s.table} role="region" aria-label="Tabela de pedidos" tabIndex={0}>
              <table><thead><tr><th scope="col">Pedido</th>{owner&&<th scope="col">Comprador</th>}<th scope="col">E-book</th><th scope="col">Valor</th><th scope="col">Status</th><th scope="col">Leitura</th>{owner&&<th scope="col">Ações</th>}</tr></thead>
                <tbody>{visible.map(o=><tr key={o.id}><td><span title={o.id}>#{o.id.slice(0,8)}</span><small>{Number.isFinite(Date.parse(o.created_at))?dt.format(new Date(o.created_at)):"Data indisponível"}</small></td>
                  {owner&&<td>{o.nome||"Nome não informado"}{o.email&&<small>{o.email}</small>}</td>}<td>{productName(o.produto)}</td><td>{formatMoney(o.valor_centavos)}</td><td><span className={`${s.badge} ${kind(o.status)}`}>{STATUS_LABEL[o.status] ?? "Desconhecido"}</span></td>
                  <td>{o.has_active_session?"Sessão ativa":o.status==="aprovado"?"Acesso liberado":"Acesso indisponível"}</td>
                  {owner&&<td><AdminOrderActions id={o.id} status={o.status} session={o.has_active_session}/></td>}</tr>)}</tbody></table>
              </div> : <Empty title={activeFilter?"Nenhum pedido neste filtro":"Nenhum pedido cadastrado"} body={activeFilter?"Escolha outro status para ampliar a busca.":"As compras aparecerão aqui assim que forem registradas."}/>}
            {last>1&&<nav className={s.filters} aria-label="Paginação dos pedidos">{cur>1&&<Link href={href("orders",activeFilter,cur-1)} prefetch={false}>Anterior</Link>}<span>Página {cur} de {last}</span>{cur<last&&<Link href={href("orders",activeFilter,cur+1)} prefetch={false}>Próxima</Link>}</nav>}
          </section>
        </>}
        {tab==="users"&&<>
          <section className={s.card}><h2>Equipe administrativa</h2>
            <p>Administradores gerenciam contas e pedidos. Operadores consultam os pedidos sem dados de contato.</p>
            {owner?<AdminTeamActions team={team}/>:<p>Somente administradores podem listar ou alterar contas da equipe.</p>}
          </section>
          <section className={s.card}><h2>Leitores da biblioteca</h2><p>Leitores não entram no painel. A compra aprovada libera a leitura do e-book correspondente.</p>
            {!owner?<p>Os dados dos leitores são restritos à administração.</p>:buyers.size?<div className={s.table} role="region" aria-label="Tabela de leitores" tabIndex={0}><table><thead><tr><th scope="col">Leitor</th><th scope="col">E-mail</th><th scope="col">Títulos liberados</th></tr></thead><tbody>{Array.from(buyers.entries()).slice(0,50).map(([email,b])=><tr key={email}><td>{b.name||"Nome não informado"}</td><td>{email}</td><td>{b.books.size}</td></tr>)}</tbody></table>{buyers.size>50&&<p>Mostrando 50 de {buyers.size} leitores. Consulte Pedidos para ver os demais registros.</p>}</div>:<Empty title="Nenhum leitor cadastrado" body="Os compradores aparecem aqui separados da equipe."/>}
          </section>
        </>}
      </main>
    </div>
  </div>;
}
