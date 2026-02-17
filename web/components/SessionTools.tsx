"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/auth";

type Session = any;

export function SessionTools({ patientId }: { patientId: string }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [fisios, setFisios] = useState<{ id: string; name: string }[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [fisioId, setFisioId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canFinalizeStatuses = useMemo(() => new Set(["AGENDADA","REMARCADA"]), []);

  async function load() {
    const s = await api<{ sessions: Session[] }>(`/sessions/patient/${patientId}`);
    setSessions(s.sessions);
  }

  // buscar fisioterapeutas (simplificado: listando usuários via /auth/me não dá; então usamos o seed fixo)
  useEffect(() => {
    setFisios([{ id: "seed-fisio", name: "Fisio (use agenda p/ escolher)" }]);
    // Para produção, crie endpoint /users?role=FISIO. Mantivemos simples no MVP.
  }, []);

  useEffect(() => { load().catch(()=>{}); }, [patientId]);

  async function schedule() {
    setError(null);
    try {
      // Como não há endpoint de listagem de usuários ainda, pedimos o ID do fisio via agenda (ou usando o fisio do seed).
      // Para facilitar no MVP, o backend aceita o fisioId real. Vamos buscar por /auth/me e usar o próprio se for FISIO.
      const me = await api<{ user: any }>(`/auth/me`);
      const chosenFisioId = fisioId || me.user.sub;

      await api(`/sessions`, {
        method: "POST",
        body: JSON.stringify({
          patientId,
          scheduledAt: new Date(scheduledAt).toISOString(),
          fisioId: chosenFisioId,
        }),
      });
      setScheduledAt("");
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function finalize(id: string) {
    const pain = prompt("Dor (0-10) — deixe vazio se quiser:", "0");
    const evolution = prompt("Evolução (pode deixar vazio se informou dor):", "");
    const procedures = prompt("Condutas/Procedimentos (opcional):", "");
    try {
      await api(`/sessions/${id}/finalize`, {
        method: "POST",
        body: JSON.stringify({
          painScore: pain === null || pain === "" ? undefined : Number(pain),
          evolution: evolution ?? undefined,
          procedures: procedures ?? undefined,
        }),
      });
      await load();
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function quickStatus(id: string, status: string) {
    const note = status === "REMARCADA" ? "Remarcada" : undefined;
    const absenceReason = status === "FALTOU" ? prompt("Motivo da falta (opcional):", "") ?? undefined : undefined;
    try {
      await api(`/sessions/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, note, absenceReason }),
      });
      await load();
    } catch (e: any) {
      alert(e.message);
    }
  }

  return (
    <div className="row" style={{ flexDirection: "column", gap: 12 }}>
      <div className="card">
        <h2>Agendar sessão (rápido)</h2>
        <div className="row">
          <div style={{ flex: 1, minWidth: 260 }}>
            <label>Data/Hora</label>
            <input className="input" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label>Fisio (opcional)</label>
            <input className="input" placeholder="deixe vazio para usar seu usuário" value={fisioId} onChange={(e) => setFisioId(e.target.value)} />
            <small>Melhoria P1: endpoint /users?role=FISIO para selecionar.</small>
          </div>
          <div style={{ alignSelf: "end" }}>
            <button className="btn" onClick={schedule} disabled={!scheduledAt}>Agendar</button>
          </div>
        </div>
        {error ? <div style={{ color: "#b91c1c", marginTop: 8 }}>{error}</div> : null}
      </div>

      <div className="card">
        <h2>Histórico de sessões</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Status</th>
              <th>Fisio</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td>{new Date(s.scheduledAt).toLocaleString()}</td>
                <td><span className="badge">{s.status}</span></td>
                <td>{s.fisio?.name ?? "-"}</td>
                <td>
                  <div className="row">
                    {canFinalizeStatuses.has(s.status) ? (
                      <button className="btn" onClick={() => finalize(s.id)}>Finalizar</button>
                    ) : null}
                    <button className="btn secondary" onClick={() => quickStatus(s.id, "FALTOU")}>Faltou</button>
                    <button className="btn secondary" onClick={() => quickStatus(s.id, "CANCELADA")}>Cancelar</button>
                    <button className="btn secondary" onClick={() => quickStatus(s.id, "REMARCADA")}>Remarcar</button>
                  </div>
                </td>
              </tr>
            ))}
            {sessions.length === 0 ? <tr><td colSpan={4}><small>Sem sessões ainda.</small></td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
