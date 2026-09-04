import Link from "next/link";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { LoginForm } from "./login-form";
import styles from "./login.module.css";

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <Link className={styles.back} href="/">← Voltar para a vitrine</Link>
      <section className={styles.card}>
        <div className={styles.mark}>AR</div>
        <p className={styles.eyebrow}>Área reservada</p>
        <h1>Bem-vinda de volta</h1>
        <p className={styles.lead}>Entre para cuidar das peças, aprovações e da sua equipe.</p>
        {hasSupabasePublicConfig ? (
          <LoginForm />
        ) : (
          <div className={styles.demoBox}>
            <strong>Modo de demonstração</strong>
            <span>Conecte o Supabase para habilitar o acesso real.</span>
            <Link href="/admin">Conhecer o painel</Link>
          </div>
        )}
      </section>
    </main>
  );
}
