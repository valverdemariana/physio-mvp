"use client";

import { useEffect, useMemo, useState } from "react";
import { Nav } from "../../components/Nav";
import { api } from "../../lib/auth";
import { requireToken } from "../../lib/guard";
import { LineChart } from "../../components/Chart";

type Summary = {
  cards: {
    sessionsTodayTotal: number;
    sessionsTodayByStatus: Record<string, number>;
    activePatients: number;
    absencesThisMonth: number;
    upcomingReevaluations7d: number;
  };
  series: { date: string; total: number; realizada: number; faltou: number }[];
};

export default function DashboardPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    requireToken();
    (async () => {
      try {
        const d = await api<Summary>("/dashboard/summary?rangeDays=14");
        setData(d);
      } catch (e: any) {
        setError(e.message ?? "Erro");
      }
    })();
  }, []);

  const labels = useMemo(() => data?.series.map(s => s.date.slice(5)) ?? [], [data]);
  const totals = useMemo(() => data?.series.map(s => s.total) ?? [], [data]);

  return (
    <div className="container">
      <Nav />
      <h1>Dashboard executivo</h1>
      {error ? <div style={{ color: "#b91c1c" }}>{error}</div> : null}
      {!data ? <div className="card">Carregando…</div> : (
        <>
          <div className="grid" style={{ marginBottom: 12 }}>
            <div className="card">
              <h2>Sessões hoje</h2>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{data.cards.sessionsTodayTotal}</div>
              <small>{Object.entries(data.cards.sessionsTodayByStatus).map(([k,v]) => `${k}: ${v}`).join(" • ")}</small>
            </div>
            <div className="card">
              <h2>Pacientes ativos</h2>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{data.cards.activePatients}</div>
              <small>Definição: sessão realizada nos últimos 45 dias</small>
            </div>
            <div className="card">
              <h2>Faltas no mês</h2>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{data.cards.absencesThisMonth}</div>
            </div>
            <div className="card">
              <h2>Reavaliações (7 dias)</h2>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{data.cards.upcomingReevaluations7d}</div>
            </div>
          </div>

          <div className="card">
            <h2>Sessões por dia (últimos 14 dias)</h2>
            <LineChart labels={labels} totals={totals} />
          </div>
        </>
      )}
    </div>
  );
}
