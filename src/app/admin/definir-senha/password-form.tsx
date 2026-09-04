"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "../login/login.module.css";

export function PasswordForm() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function prepareSession() {
      const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = fragment.get("access_token");
      const refreshToken = fragment.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          if (!cancelled) setMessage("Este link expirou ou já foi usado. Solicite um novo link de acesso.");
          return;
        }
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      }

      const { data, error } = await supabase.auth.getSession();
      if (cancelled) return;
      if (error || !data.session) {
        setMessage("Este link expirou ou já foi usado. Solicite um novo link de acesso.");
        return;
      }
      setSessionReady(true);
    }

    void prepareSession();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    const confirmation = String(form.get("confirmation"));
    if (password !== confirmation) {
      setMessage("As senhas não coincidem.");
      setBusy(false);
      return;
    }
    if (!sessionReady) {
      setMessage("Aguarde a validação do link de acesso.");
      setBusy(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form className={styles.form} onSubmit={save}>
      <label>Nova senha<input required minLength={8} name="password" type="password" autoComplete="new-password" /></label>
      <label>Repita a senha<input required minLength={8} name="confirmation" type="password" autoComplete="new-password" /></label>
      {message && <p className={styles.error}>{message}</p>}
      <button disabled={busy || !sessionReady}>
        {!sessionReady ? "Validando link…" : busy ? "Salvando…" : "Criar senha e entrar"}
      </button>
    </form>
  );
}
