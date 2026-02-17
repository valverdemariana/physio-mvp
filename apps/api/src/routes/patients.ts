import { Router } from "express";
import { prisma } from "../prisma.js";
import { patientCreateSchema, patientUpdateSchema } from "../validators.js";
import { authRequired } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { PayerType } from "@prisma/client";

export const patientsRouter = Router();

patientsRouter.use(authRequired);

// Listar + busca + filtros
patientsRouter.get("/", async (req, res) => {
  const search = (req.query.search as string | undefined)?.trim();
  const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
  const payerType = (req.query.payerType as PayerType | undefined);

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }
  if (typeof isActive === "boolean") where.isActive = isActive;
  if (payerType) where.payerType = payerType;

  const patients = await prisma.patient.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  res.json({ patients });
});

patientsRouter.post("/", requireRole("ADMIN", "FISIO"), async (req: any, res) => {
  const parsed = patientCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const data = parsed.data;
  const birthDate = data.birthDate ? new Date(data.birthDate) : undefined;

  const patient = await prisma.patient.create({
    data: {
      ...data,
      birthDate,
      createdById: req.user.sub,
      updatedById: req.user.sub,
    },
  });
  res.status(201).json({ patient });
});

patientsRouter.get("/:id", async (req, res) => {
  const patient = await prisma.patient.findUnique({
    where: { id: req.params.id },
    include: {
      treatmentPlans: { orderBy: { updatedAt: "desc" }, take: 1 },
    },
  });
  if (!patient) return res.status(404).json({ error: "Paciente não encontrado" });
  res.json({ patient });
});

patientsRouter.put("/:id", requireRole("ADMIN", "FISIO"), async (req: any, res) => {
  const parsed = patientUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const data = parsed.data as any;
  if (data.birthDate) data.birthDate = new Date(data.birthDate);

  const patient = await prisma.patient.update({
    where: { id: req.params.id },
    data: { ...data, updatedById: req.user.sub },
  });
  res.json({ patient });
});

patientsRouter.patch("/:id/inactivate", requireRole("ADMIN", "FISIO"), async (req: any, res) => {
  const patient = await prisma.patient.update({
    where: { id: req.params.id },
    data: { isActive: false, updatedById: req.user.sub },
  });
  res.json({ patient });
});
