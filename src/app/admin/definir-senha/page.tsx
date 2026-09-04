import { PasswordForm } from "./password-form";
import styles from "../login/login.module.css";

export default function SetPasswordPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.mark}>AR</div>
        <p className={styles.eyebrow}>Seu acesso está quase pronto</p>
        <h1>Crie sua senha</h1>
        <p className={styles.lead}>Escolha uma senha segura para entrar no painel.</p>
        <PasswordForm />
      </section>
    </main>
  );
}
