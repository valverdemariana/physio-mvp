"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Nav } from "../../../components/Nav";
import { api } from "../../../lib/auth";
import { requireToken } from "../../../lib/guard";
import { PatientForm } from "../../../components/PatientForm";
import { PlanEditor } from "../../../components/PlanEditor";
import { SessionTools } from "../../../components/SessionTools";

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [patient, setPatient] = useState<any>(null);
  const [tab, setTab] = useState<"perfil" | "plano" | "sessoes">("perfil");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await api<{ patient: any }>(`/patients/${id}`);
    setPatient(data.patient);
  }

  useEffect(() => {
    requireToken();
    load().catch((e: any) => setError(e.message));
  }, [id]);

  async function inactivate() {
    if (!confirm("Inativar este paciente?")) return;
    await api(`/patients/${id}/inactivate`, { method: "PATCH" });
    await load();
  }

  const whatsappLink = patient?.phone ? `https://wa.me/${patient.phone.replace(/\D/g,"")}` : null;

  return (
    <div className="container">
      <Nav />
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1>{patient?.name ?? "Paciente"}</h1>
          <small>{patient?.phone} • {patient?.payerType} • {patient?.isActive ? "Ativo" : "Inativo"}</small>
        </div>
        <div className="row">
          {whatsappLink ? <a className="btn secondary" href={whatsappLink} target="_blank">WhatsApp</a> : null}
          <button className="btn danger" onClick={inactivate} disabled={!patient?.isActive}>Inativar</button>
          <Link className="btn secondary" href="/patients">Voltar</Link>
        </div>
      </div>

      {error ? <div style={{ color: "#b91c1c" }}>{error}</div> : null}
      {!patient ? <div className="card">Carregando…</div> : (
        <>
          <div className="row" style={{ marginBottom: 12 }}>
            <button className={"btn " + (tab === "perfil" ? "" : "secondary")} onClick={() => setTab("perfil")}>Perfil</button>
            <button className={"btn " + (tab === "plano" ? "" : "secondary")} onClick={() => setTab("plano")}>Plano</button>
            <button className={"btn " + (tab === "sessoes" ? "" : "secondary")} onClick={() => setTab("sessoes")}>Sessões</button>
          </div>

          {tab === "perfil" ? <PatientForm initial={patient} /> : null}
          {tab === "plano" ? <PlanEditor patientId={id} /> : null}
          {tab === "sessoes" ? <SessionTools patientId={id} /> : null}
        </>
      )}
    </div>
  );
}
