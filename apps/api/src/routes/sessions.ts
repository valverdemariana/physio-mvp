import { Router } from "express";
import { prisma } from "../prisma.js";
import { authRequired } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { agendaQuerySchema, sessionCreateSchema, sessionFinalizeSchema, sessionStatusSchema } from "../validators.js";
import { SessionStatus } from "@prisma/client";

export const sessionsRouter = Router();
sessionsRouter.use(authRequired);

// Agendar sessão
sessionsRouter.post("/", requireRole("ADMIN", "FISIO", "RECEPCAO"), async (req: any, res) => {
  const parsed = sessionCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const scheduledAt = new Date(parsed.data.scheduledAt);

  // Regra: impedir sessão no passado (opcional mas recomendado)
  if (scheduledAt.getTime() < Date.now() - 5 * 60 * 1000) {
    return res.status(400).json({ error: "Não é permitido agendar sessão no passado." });
  }

  const session = await prisma.session.create({
    data: {
      patientId: parsed.data.patientId,
      scheduledAt,
      fisioId: parsed.data.fisioId,
      status: SessionStatus.AGENDADA,
      createdById: req.user.sub,
      updatedById: req.user.sub,
    },
  });

  await prisma.sessionStatusLog.create({
    data: { sessionId: session.id, fromStatus: null, toStatus: session.status, changedById: req.user.sub, note: "Criada" },
  });

  res.status(201).json({ session });
});

// Atualizar status
sessionsRouter.patch("/:id/status", requireRole("ADMIN", "FISIO", "RECEPCAO"), async (req: any, res) => {
  const parsed = sessionStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const session = await prisma.session.findUnique({ where: { id: req.params.id } });
  if (!session) return res.status(404).json({ error: "Sessão não encontrada" });

  // Recepção não pode marcar como REALIZADA (sem evolução clínica)
  if (req.user.role === "RECEPCAO" && parsed.data.status === SessionStatus.REALIZADA) {
    return res.status(403).json({ error: "Recepção não pode finalizar como realizada." });
  }

  const updated = await prisma.session.update({
    where: { id: session.id },
    data: {
      status: parsed.data.status,
      absenceReason: parsed.data.absenceReason ?? session.absenceReason,
      updatedById: req.user.sub,
    },
  });

  await prisma.sessionStatusLog.create({
    data: {
      sessionId: session.id,
      fromStatus: session.status,
      toStatus: parsed.data.status,
      note: parsed.data.note,
      changedById: req.user.sub,
    },
  });

  res.json({ session: updated });
});

// Finalizar sessão (dor + evolução + condutas)
sessionsRouter.post("/:id/finalize", requireRole("ADMIN", "FISIO"), async (req: any, res) => {
  const parsed = sessionFinalizeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const session = await prisma.session.findUnique({ where: { id: req.params.id } });
  if (!session) return res.status(404).json({ error: "Sessão não encontrada" });

  // Regra: REALIZADA exige dor OU evolução (mínimo 1 campo)
  const hasPain = typeof parsed.data.painScore === "number";
  const hasEvolution = !!parsed.data.evolution?.trim();
  if (!hasPain && !hasEvolution) {
    return res.status(400).json({ error: "Para finalizar como realizada, informe dor (0–10) ou evolução." });
  }

  const nextSessionAt = parsed.data.nextSessionAt ? new Date(parsed.data.nextSessionAt) : undefined;

  const updated = await prisma.session.update({
    where: { id: session.id },
    data: {
      painScore: parsed.data.painScore ?? session.painScore,
      evolution: parsed.data.evolution ?? session.evolution,
      procedures: parsed.data.procedures ?? session.procedures,
      nextSessionAt,
      status: SessionStatus.REALIZADA,
      updatedById: req.user.sub,
    },
  });

  await prisma.sessionStatusLog.create({
    data: {
      sessionId: session.id,
      fromStatus: session.status,
      toStatus: SessionStatus.REALIZADA,
      note: "Finalizada",
      changedById: req.user.sub,
    },
  });

  res.json({ session: updated });
});

// Histórico de sessões por paciente
sessionsRouter.get("/patient/:patientId", async (req, res) => {
  const sessions = await prisma.session.findMany({
    where: { patientId: req.params.patientId },
    orderBy: { scheduledAt: "desc" },
    include: { fisio: { select: { id: true, name: true, email: true } } },
    take: 200,
  });
  res.json({ sessions });
});

// Agenda do dia
sessionsRouter.get("/agenda", async (req, res) => {
  const parsed = agendaQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const date = parsed.data.date;
  const start = new Date(date + "T00:00:00.000Z");
  const end = new Date(date + "T23:59:59.999Z");

  const where: any = { scheduledAt: { gte: start, lte: end } };
  if (parsed.data.fisioId) where.fisioId = parsed.data.fisioId;
  if (parsed.data.status) where.status = parsed.data.status;

  const sessions = await prisma.session.findMany({
    where,
    orderBy: { scheduledAt: "asc" },
    include: {
      patient: { select: { id: true, name: true, phone: true } },
      fisio: { select: { id: true, name: true } },
    },
  });

  res.json({ sessions });
});
