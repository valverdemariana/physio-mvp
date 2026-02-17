import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma.js";
import { loginSchema } from "../validators.js";
import { signToken } from "../auth/jwt.js";
import { authRequired } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return res.status(401).json({ error: "Credenciais inválidas" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Credenciais inválidas" });

  const token = signToken({ sub: user.id, role: user.role, email: user.email, name: user.name });
  return res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

authRouter.get("/me", authRequired, async (req: any, res) => {
  return res.json({ user: req.user });
});

// Stub: recuperação de senha por e-mail (pronto para integrar com SMTP/Resend)
authRouter.post("/request-password-reset", async (_req, res) => {
  return res.json({ ok: true, message: "Stub: integrar envio de e-mail aqui." });
});

authRouter.post("/reset-password", async (_req, res) => {
  return res.json({ ok: true, message: "Stub: integrar reset de senha aqui." });
});
