"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./login.module.css";

export function LoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const { error: authError } = await createClient().auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    if (authError) {
      setError("E-mail ou senha incorretos.");
      setBusy(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form className={styles.form} onSubmit={login}>
      <label>E-mail<input required name="email" type="email" autoComplete="email" placeholder="seu@email.com" /></label>
      <label>Senha<input required minLength={6} name="password" type="password" autoComplete="current-password" placeholder="••••••••" /></label>
      {error && <p className={styles.error}>{error}</p>}
      <button disabled={busy}>{busy ? "Entrando…" : "Entrar no painel"}</button>
    </form>
  );
}
