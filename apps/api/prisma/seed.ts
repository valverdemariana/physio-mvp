/// <reference types="node" />
import bcrypt from "bcryptjs";
import { PrismaClient, Role, PayerType, SessionStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function upsertUser(email: string, name: string, role: Role, password: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: { name, role, passwordHash, isActive: true },
    create: { email, name, role, passwordHash }
  });
}

async function main() {
  const admin1 = await upsertUser("admin1@clinic.local", "Admin 1", Role.ADMIN, "Admin123!");
  const admin2 = await upsertUser("admin2@clinic.local", "Admin 2", Role.ADMIN, "Admin123!");
  const fisio = await upsertUser("fisio@clinic.local", "Fisio", Role.FISIO, "User123!");
  await upsertUser("recepcao@clinic.local", "Recepção", Role.RECEPCAO, "User123!");

  // Seed mínimo para testar
  const patient = await prisma.patient.create({
    data: {
      name: "Paciente Exemplo",
      phone: "+55 11 99999-0000",
      email: "paciente@exemplo.com",
      payerType: "PARTICULAR",
      complaint: "Dor lombar",
      notes: "Primeira avaliação pendente",
      alerts: "Alergia a esparadrapo",
      createdById: admin1.id,
      updatedById: admin1.id
    }
  });

  const plan = await prisma.treatmentPlan.upsert({
    where: { id: (await prisma.treatmentPlan.findFirst({ where: { patientId: patient.id } }))?.id ?? "___" },
    update: {},
    create: {
      patientId: patient.id,
      objective: "Reduzir dor e melhorar mobilidade",
      frequency: "2x por semana",
      procedures: "Alongamentos + fortalecimento + orientações",
      reevaluationAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdById: admin1.id,
      updatedById: admin1.id
    }
  }).catch(async () => {
    const existing = await prisma.treatmentPlan.findFirst({ where: { patientId: patient.id } });
    return existing!;
  });

  await prisma.treatmentPlanVersion.create({
    data: {
      treatmentPlanId: plan.id,
      snapshot: {
        objective: plan.objective,
        frequency: plan.frequency,
        procedures: plan.procedures,
        reevaluationAt: plan.reevaluationAt
      }
    }
  });

  const session = await prisma.session.create({
    data: {
      patientId: patient.id,
      scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      fisioId: fisio.id,
      status: SessionStatus.AGENDADA,
      createdById: admin1.id,
      updatedById: admin1.id
    }
  });

  await prisma.sessionStatusLog.create({
    data: {
      sessionId: session.id,
      fromStatus: null,
      toStatus: SessionStatus.AGENDADA,
      note: "Sessão criada no seed",
      changedById: admin1.id
    }
  });

  console.log("Seed concluído.");
  console.log("Logins iniciais:");
  console.log("admin1@clinic.local / Admin123!");
  console.log("admin2@clinic.local / Admin123!");
  console.log("fisio@clinic.local / User123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
