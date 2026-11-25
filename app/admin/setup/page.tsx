import { notFound } from "next/navigation";
import { adminSetupAvailable } from "@/lib/admin-setup";
import SetupForm from "./SetupForm";
import s from "../admin-dashboard.module.css";

export const dynamic = "force-dynamic";
export const metadata = {title:"Configuração administrativa", robots:{ index:false, follow:false }};

export default async function SetupPage(){
  if (!(await adminSetupAvailable())) notFound();
  return <main className={s.login}>
    <div className={s.loginCard}>
      <p className={s.kicker}>Honestamente, Itamar</p>
      <h1>Primeiro acesso administrativo</h1>
      <p>Configure a conta proprietária com o código temporário criado na hospedagem. A configuração só pode ser concluída uma vez.</p>
      <SetupForm />
      <p className={s.loginFoot}>Não compartilhe o código ou as senhas por mensagem.</p>
    </div>
  </main>;
}
