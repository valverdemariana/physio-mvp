import jwt, { SignOptions, JwtPayload } from "jsonwebtoken";
import { env } from "../env";

export function signToken(payload: object) {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as any,
  };

  return jwt.sign(payload, env.JWT_SECRET as string, options);
}

export function verifyToken(token: string): JwtPayload & { sub?: string } {
  return jwt.verify(token, env.JWT_SECRET as string) as JwtPayload & { sub?: string };
}
