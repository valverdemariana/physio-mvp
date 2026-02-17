"use client";

import { useState } from "react";
import { api } from "../lib/auth";

type PayerType = "CONVENIO" | "PARTICULAR";

export function PatientForm({ initial }: { initial?: any }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [payerType, setPayerType] = useState<PayerType>(initial?.payerType ?? "PARTICULAR");
  const [complaint, setComplaint] = useState(initial?.complaint ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [alerts, setAlerts] = useState(initial?.alerts ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(null);
    setSaving(true);
    try {
      const payload = { name, phone, email, payerType, complaint, notes, alerts };
      if (initial?.id) {
        await api(`/patients/${initial.id}`, { method: "PUT", body: JSON.stringify(payload) });
        window.location.href = `/patients/${initial.id}`;
      } else {
        const res = await api<{ patient: { id: string } }>(`/patients`, { method: "POST", body: JSON.stringify(payload) });
        window.location.href = `/patients/${res.patient.id}`;
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="grid">
        <div>
          <label>Nome *</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label>Telefone *</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label>E-mail</label>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label>Convênio/Particular</label>
          <select className="input" value={payerType} onChange={(e) => setPayerType(e.target.value as PayerType)}>
            <option value="CONVENIO">Convênio</option>
            <option value="PARTICULAR">Particular</option>
          </select>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label>Queixa/Diagnóstico</label>
          <textarea className="input" rows={2} value={complaint} onChange={(e) => setComplaint(e.target.value)} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label>Observações</label>
          <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label>Alertas</label>
          <textarea className="input" rows={2} value={alerts} onChange={(e) => setAlerts(e.target.value)} />
        </div>
      </div>

      {error ? <div style={{ color: "#b91c1c", marginTop: 10 }}>{error}</div> : null}

      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn" onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
        <button className="btn secondary" onClick={() => history.back()}>Voltar</button>
      </div>
    </div>
  );
}
