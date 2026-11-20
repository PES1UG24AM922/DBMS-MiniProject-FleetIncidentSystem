import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export type Role = "ADMIN" | "MANAGER" | "DRIVER";
export type Session = { userId: number; role: Role; driverId: number | null };
const key = () => new TextEncoder().encode(process.env.JWT_SECRET!);

export async function createSession(s: Session) {
  const token = await new SignJWT({ ...s }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("8h").sign(key());
  (await cookies()).set("session", token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 8 * 3600,
  });
}

export async function destroySession() {
  (await cookies()).delete("session");
}

export async function getSession(): Promise<Session | null> {
  const t = (await cookies()).get("session")?.value;
  if (!t) return null;
  try {
    return (await jwtVerify(t, key())).payload as unknown as Session;
  } catch {
    return null;
  }
}
