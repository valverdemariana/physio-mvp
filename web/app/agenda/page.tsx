"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Nav } from "../../components/Nav";
import { api } from "../../lib/auth";
import { requireToken } from "../../lib/guard";

type Session = any;

export default function AgendaPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [status, setStatus] = useState<string>("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    const qs = new URLSearchParams({ date });
    if (status) qs.set("status", status);
    const data = await api<{ sessions: Session[] }>(`/sessions/agenda?${qs.toString()}`);
    setSessions(data.sessions);
  }

  useEffect(() => { requireToken(); load().catch((e:any)=>setError(e.message)); }, []);

  async function quick(id: string, newStatus: string) {
    const absenceReason = newStatus === "FALTOU" ? prompt("Motivo da falta (opcional):", "") ?? undefined : undefined;
    await api(`/sessions/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus, absenceReason }),
    });
    await load();
  }

  return (
    <div className="container">
      <Nav />
      <h1>Agenda do dia</h1>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="row">
          <div style={{ minWidth: 200 }}>
            <label>Data</label>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div style={{ minWidth: 220 }}>
            <label>Status</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Todos</option>
              <option value="AGENDADA">Agendada</option>
              <option value="REALIZADA">Realizada</option>
              <option value="FALTOU">Faltou</option>
              <option value="REMARCADA">Remarcada</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>
          <div style={{ alignSelf: "end" }}>
            <button className="btn" onClick={() => load().catch((e:any)=>setError(e.message))}>Aplicar</button>
          </div>
          <div style={{ alignSelf: "end" }}>
            <Link className="btn secondary" href="/patients/new">+ Nova sessão (via paciente)</Link>
          </div>
        </div>
        {error ? <div style={{ color: "#b91c1c", marginTop: 8 }}>{error}</div> : null}
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Hora</th>
              <th>Paciente</th>
              <th>Fisio</th>
              <th>Status</th>
              <th>Ações rápidas</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td>{new Date(s.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                <td><Link href={`/patients/${s.patient.id}`}>{s.patient.name}</Link></td>
                <td>{s.fisio?.name ?? "-"}</td>
                <td><span className="badge">{s.status}</span></td>
                <td>
                  <div className="row">
                    <button className="btn secondary" onClick={() => quick(s.id, "FALTOU")}>Faltou</button>
                    <button className="btn secondary" onClick={() => quick(s.id, "CANCELADA")}>Cancelar</button>
                    <button className="btn secondary" onClick={() => quick(s.id, "REMARCADA")}>Remarcar</button>
                  </div>
                  <small>Finalizar como realizada é feito no perfil do paciente (aba Sessões).</small>
                </td>
              </tr>
            ))}
            {sessions.length === 0 ? <tr><td colSpan={5}><small>Sem sessões para esta data.</small></td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
