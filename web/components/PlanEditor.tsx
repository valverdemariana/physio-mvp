"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/auth";

export function PlanEditor({ patientId }: { patientId: string }) {
  const [objective, setObjective] = useState("");
  const [frequency, setFrequency] = useState("");
  const [procedures, setProcedures] = useState("");
  const [reevaluationAt, setReevaluationAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { plan } = await api<{ plan: any }>(`/plans/patient/${patientId}`);
      if (!plan) return;
      setObjective(plan.objective ?? "");
      setFrequency(plan.frequency ?? "");
      setProcedures(plan.procedures ?? "");
      setReevaluationAt(plan.reevaluationAt ? new Date(plan.reevaluationAt).toISOString().slice(0,16) : "");
    })().catch(() => {});
  }, [patientId]);

  async function save() {
    setMsg(null);
    setSaving(true);
    try {
      await api(`/plans/patient/${patientId}`, {
        method: "PUT",
        body: JSON.stringify({
          objective, frequency, procedures,
          reevaluationAt: reevaluationAt ? new Date(reevaluationAt).toISOString() : ""
        }),
      });
      setMsg("Plano salvo (com histórico).");
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="grid">
        <div style={{ gridColumn: "1 / -1" }}>
          <label>Objetivo</label>
          <textarea className="input" rows={2} value={objective} onChange={(e) => setObjective(e.target.value)} />
        </div>
        <div>
          <label>Frequência</label>
          <input className="input" value={frequency} onChange={(e) => setFrequency(e.target.value)} />
        </div>
        <div>
          <label>Reavaliação</label>
          <input className="input" type="datetime-local" value={reevaluationAt} onChange={(e) => setReevaluationAt(e.target.value)} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label>Condutas/Exercícios</label>
          <textarea className="input" rows={4} value={procedures} onChange={(e) => setProcedures(e.target.value)} />
        </div>
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn" onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar plano"}</button>
        {msg ? <small>{msg}</small> : null}
      </div>
    </div>
  );
}
