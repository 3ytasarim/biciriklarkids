import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { createdAt, updatedAt } from "./columns";
import { adminRole } from "./enums";

export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid().defaultRandom().primaryKey(),
    name: varchar({ length: 120 }).notNull(),
    email: varchar({ length: 160 }).notNull(),
    passwordHash: text().notNull(),
    role: adminRole().default("editor").notNull(),
    isActive: boolean().default(true).notNull(),
    lastLoginAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("admin_users_email_uq").on(t.email)],
);

export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: uuid().defaultRandom().primaryKey(),
    adminUserId: uuid()
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    tokenHash: varchar({ length: 64 }).notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("admin_sessions_token_uq").on(t.tokenHash)],
);

/** Genel amaçlı rate limit kayıtları (giriş denemesi, form gönderimi, yorum, bülten…). key: "login:email:x", "form:ip:y" */
export const rateLimitEvents = pgTable(
  "rate_limit_events",
  {
    id: uuid().defaultRandom().primaryKey(),
    key: varchar({ length: 200 }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("rate_limit_key_idx").on(t.key, t.createdAt)],
);
