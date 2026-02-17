import { Router } from "express";
import { prisma } from "../prisma.js";
import { authRequired } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { planUpsertSchema } from "../validators.js";

export const plansRouter = Router();

plansRouter.use(authRequired);

plansRouter.get("/patient/:patientId", async (req, res) => {
  const plan = await prisma.treatmentPlan.findFirst({
    where: { patientId: req.params.patientId },
    orderBy: { updatedAt: "desc" },
  });
  res.json({ plan });
});

plansRouter.put("/patient/:patientId", requireRole("ADMIN", "FISIO"), async (req: any, res) => {
  const parsed = planUpsertSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { patientId } = req.params;
  const data = parsed.data;

  const reevaluationAt = data.reevaluationAt ? new Date(data.reevaluationAt) : undefined;

  const existing = await prisma.treatmentPlan.findFirst({ where: { patientId }, orderBy: { updatedAt: "desc" } });

  let plan;
  if (!existing) {
    plan = await prisma.treatmentPlan.create({
      data: {
        patientId,
        ...data,
        reevaluationAt,
        createdById: req.user.sub,
        updatedById: req.user.sub,
      },
    });
  } else {
    // versionar antes de atualizar
    await prisma.treatmentPlanVersion.create({
      data: {
        treatmentPlanId: existing.id,
        snapshot: {
          objective: existing.objective,
          frequency: existing.frequency,
          procedures: existing.procedures,
          reevaluationAt: existing.reevaluationAt,
          updatedAt: existing.updatedAt,
        },
      },
    });

    plan = await prisma.treatmentPlan.update({
      where: { id: existing.id },
      data: { ...data, reevaluationAt, updatedById: req.user.sub },
    });
  }

  res.json({ plan });
});

plansRouter.get("/plan/:planId/versions", requireRole("ADMIN", "FISIO"), async (req, res) => {
  const versions = await prisma.treatmentPlanVersion.findMany({
    where: { treatmentPlanId: req.params.planId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  res.json({ versions });
});
