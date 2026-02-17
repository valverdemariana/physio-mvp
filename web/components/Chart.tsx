"use client";

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

export function LineChart({ labels, totals }: { labels: string[]; totals: number[] }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = ref.current.getContext("2d");
    if (!ctx) return;

    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{ label: "Sessões (total)", data: totals }],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });

    return () => chart.destroy();
  }, [labels, totals]);

  return <div style={{ height: 260 }}><canvas ref={ref} /></div>;
}
