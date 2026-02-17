import { Router } from "express";
import { prisma } from "../prisma.js";
import { authRequired } from "../middleware/auth.js";
import { dashboardQuerySchema } from "../validators.js";
import { SessionStatus } from "@prisma/client";

export const dashboardRouter = Router();
dashboardRouter.use(authRequired);

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23,59,59,999);
  return x;
}
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

dashboardRouter.get("/summary", async (req, res) => {
  const parsed = dashboardQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const today = parsed.data.date ? new Date(parsed.data.date + "T12:00:00.000Z") : new Date();
  const dayStart = startOfDay(today);
  const dayEnd = endOfDay(today);

  const sessionsToday = await prisma.session.findMany({
    where: { scheduledAt: { gte: dayStart, lte: dayEnd } },
    select: { status: true },
  });

  const byStatus = sessionsToday.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});

  // pacientes ativos: sessão REALIZADA nos últimos 45 dias
  const activeSince = addDays(today, -45);
  const activePatients = await prisma.patient.count({
    where: {
      isActive: true,
      sessions: { some: { status: SessionStatus.REALIZADA, scheduledAt: { gte: activeSince } } },
    },
  });

  // faltas no mês
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
  const absences = await prisma.session.count({
    where: { status: SessionStatus.FALTOU, scheduledAt: { gte: monthStart, lte: monthEnd } },
  });

  // reavaliações próximos 7 dias
  const reevaluationEnd = addDays(today, 7);
  const upcomingReevaluations = await prisma.treatmentPlan.count({
    where: { reevaluationAt: { gte: dayStart, lte: endOfDay(reevaluationEnd) } },
  });

  // série simples: sessões por dia últimos N dias
  const range = Math.min(Math.max(parsed.data.rangeDays ?? 7, 7), 30);
  const startRange = addDays(dayStart, -(range - 1));

  const sessionsRange = await prisma.session.findMany({
    where: { scheduledAt: { gte: startRange, lte: dayEnd } },
    select: { scheduledAt: true, status: true },
  });

  const buckets: { date: string; total: number; realizada: number; faltou: number }[] = [];
  for (let i = 0; i < range; i++) {
    const d = addDays(startRange, i);
    const key = d.toISOString().slice(0, 10);
    buckets.push({ date: key, total: 0, realizada: 0, faltou: 0 });
  }
  const map = new Map(buckets.map(b => [b.date, b]));
  for (const s of sessionsRange) {
    const key = startOfDay(s.scheduledAt).toISOString().slice(0, 10);
    const b = map.get(key);
    if (!b) continue;
    b.total += 1;
    if (s.status === SessionStatus.REALIZADA) b.realizada += 1;
    if (s.status === SessionStatus.FALTOU) b.faltou += 1;
  }

  res.json({
    cards: {
      sessionsTodayTotal: sessionsToday.length,
      sessionsTodayByStatus: byStatus,
      activePatients,
      absencesThisMonth: absences,
      upcomingReevaluations7d: upcomingReevaluations,
    },
    series: buckets,
  });
});
