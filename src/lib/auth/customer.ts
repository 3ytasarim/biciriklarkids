import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { eq, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers, customerSessions } from "@/lib/db/schema";
import { CUSTOMER_SESSION_COOKIE } from "./cookies";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 gün
const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

export type Customer = { id: string; email: string; firstName: string | null; lastName: string | null; phone: string | null };

export async function createCustomerSession(customerId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(customerSessions).values({ customerId, tokenHash: hashToken(token), expiresAt });
  await db.delete(customerSessions).where(lt(customerSessions.expiresAt, new Date()));
  (await cookies()).set(CUSTOMER_SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: expiresAt });
}

export const getCustomer = cache(async (): Promise<Customer | null> => {
  const token = (await cookies()).get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const [row] = await db
    .select({ id: customers.id, email: customers.email, firstName: customers.firstName, lastName: customers.lastName, phone: customers.phone, isActive: customers.isActive, expiresAt: customerSessions.expiresAt })
    .from(customerSessions)
    .innerJoin(customers, eq(customerSessions.customerId, customers.id))
    .where(eq(customerSessions.tokenHash, hashToken(token)))
    .limit(1);
  if (!row || row.expiresAt < new Date() || !row.isActive) return null;
  return { id: row.id, email: row.email, firstName: row.firstName, lastName: row.lastName, phone: row.phone };
});

export async function destroyCustomerSession() {
  const store = await cookies();
  const token = store.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (token) await db.delete(customerSessions).where(eq(customerSessions.tokenHash, hashToken(token)));
  store.delete(CUSTOMER_SESSION_COOKIE);
}
