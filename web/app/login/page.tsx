"use client";

import { useState } from "react";
import { api, setToken } from "../../lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("admin1@clinic.local");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api<{ token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message ?? "Erro ao logar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <h1>Login</h1>
      <div className="card">
        <form onSubmit={onSubmit} className="row" style={{ flexDirection: "column" }}>
          <div>
            <label>E-mail</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label>Senha</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error ? <div style={{ color: "#b91c1c" }}>{error}</div> : null}
          <button className="btn" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
          <small>
            Logins iniciais no README. Recuperação de senha está como stub no backend.
          </small>
        </form>
      </div>
    </div>
  );
}
