import jwt from "jsonwebtoken";

export interface JwtPayload {
  userId: string;
  companyId: string;
  role: string;
}

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN as jwt.SignOptions["expiresIn"] });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}
