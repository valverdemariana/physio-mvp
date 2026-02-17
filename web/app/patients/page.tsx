"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Nav } from "../../components/Nav";
import { api } from "../../lib/auth";
import { requireToken } from "../../lib/guard";

type Patient = {
  id: string;
  name: string;
  phone: string;
  payerType: "CONVENIO" | "PARTICULAR";
  isActive: boolean;
  updatedAt: string;
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState<string>("true");
  const [payerType, setPayerType] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    const qs = new URLSearchParams();
    if (search.trim()) qs.set("search", search.trim());
    if (isActive) qs.set("isActive", isActive);
    if (payerType) qs.set("payerType", payerType);

    const data = await api<{ patients: Patient[] }>(`/patients?${qs.toString()}`);
    setPatients(data.patients);
  }

  useEffect(() => {
    requireToken();
    load().catch((e: any) => setError(e.message));
  }, []);

  return (
    <div className="container">
      <Nav />
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <h1>Pacientes</h1>
        <Link className="btn" href="/patients/new">+ Novo paciente</Link>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="row">
          <div style={{ flex: 2, minWidth: 220 }}>
            <label>Buscar (nome/telefone)</label>
            <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label>Status</label>
            <select className="input" value={isActive} onChange={(e) => setIsActive(e.target.value)}>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
              <option value="">Todos</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label>Convênio/Particular</label>
            <select className="input" value={payerType} onChange={(e) => setPayerType(e.target.value)}>
              <option value="">Todos</option>
              <option value="CONVENIO">Convênio</option>
              <option value="PARTICULAR">Particular</option>
            </select>
          </div>
          <div style={{ alignSelf: "end" }}>
            <button className="btn" onClick={() => load().catch((e:any)=>setError(e.message))}>Aplicar</button>
          </div>
        </div>
        {error ? <div style={{ color: "#b91c1c", marginTop: 8 }}>{error}</div> : null}
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Telefone</th>
              <th>Tipo</th>
              <th>Status</th>
              <th>Atualizado</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id}>
                <td><Link href={`/patients/${p.id}`}>{p.name}</Link></td>
                <td>{p.phone}</td>
                <td><span className="badge">{p.payerType}</span></td>
                <td>{p.isActive ? "Ativo" : "Inativo"}</td>
                <td>{new Date(p.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
            {patients.length === 0 ? (
              <tr><td colSpan={5}><small>Nenhum paciente encontrado.</small></td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
