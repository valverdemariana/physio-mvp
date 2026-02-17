import type { Response, NextFunction } from "express";
import type { Role } from "@prisma/client";
import type { AuthedRequest } from "./auth.js";

export function requireRole(...allowed: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role) return res.status(401).json({ error: "Não autenticado" });
    if (!allowed.includes(role)) return res.status(403).json({ error: "Sem permissão" });
    return next();
  };
}
