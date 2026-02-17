import { z } from "zod";
import { PayerType, SessionStatus } from "@prisma/client";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const patientCreateSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  phone: z.string().min(5, "Telefone obrigatório"),
  email: z.string().email().optional().or(z.literal("")).transform(v => v || undefined),
  birthDate: z.string().datetime().optional().or(z.literal("")).transform(v => v || undefined),
  payerType: z.nativeEnum(PayerType),
  complaint: z.string().optional(),
  notes: z.string().optional(),
  alerts: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const patientUpdateSchema = patientCreateSchema.partial();

export const planUpsertSchema = z.object({
  objective: z.string().optional(),
  frequency: z.string().optional(),
  procedures: z.string().optional(),
  reevaluationAt: z.string().datetime().optional().or(z.literal("")).transform(v => v || undefined),
});

export const sessionCreateSchema = z.object({
  patientId: z.string().min(1),
  scheduledAt: z.string().datetime(),
  fisioId: z.string().min(1),
});

export const sessionStatusSchema = z.object({
  status: z.nativeEnum(SessionStatus),
  note: z.string().optional(),
  absenceReason: z.string().optional(),
});

export const sessionFinalizeSchema = z.object({
  painScore: z.number().int().min(0).max(10).optional(),
  evolution: z.string().optional(),
  procedures: z.string().optional(),
  nextSessionAt: z.string().datetime().optional().or(z.literal("")).transform(v => v || undefined),
});

export const agendaQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fisioId: z.string().optional(),
  status: z.nativeEnum(SessionStatus).optional(),
});

export const dashboardQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  rangeDays: z.coerce.number().optional().default(7),
});
