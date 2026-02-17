import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./env.js";
import { authRouter } from "./routes/auth.js";
import { patientsRouter } from "./routes/patients.js";
import { plansRouter } from "./routes/plans.js";
import { sessionsRouter } from "./routes/sessions.js";
import { dashboardRouter } from "./routes/dashboard.js";

const app = express();

app.use(helmet());
app.use(express.json({ limit: "1mb" }));

app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: false,
}));

app.use(rateLimit({ windowMs: 60_000, max: 300 }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRouter);
app.use("/patients", patientsRouter);
app.use("/plans", plansRouter);
app.use("/sessions", sessionsRouter);
app.use("/dashboard", dashboardRouter);

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ error: "Erro interno" });
});

app.listen(env.PORT, () => {
  console.log(`API rodando em http://localhost:${env.PORT}`);
});
