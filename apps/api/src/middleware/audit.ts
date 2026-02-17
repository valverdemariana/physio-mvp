import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "./auth.js";

export function withUserContext(req: AuthedRequest, _res: Response, next: NextFunction) {
  // facilita acesso ao userId em handlers
  (req as any).userId = req.user?.sub ?? null;
  next();
}
