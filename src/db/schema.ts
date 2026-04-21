import { mysqlTable, int, varchar, timestamp } from "drizzle-orm/mysql-core";

/**
 * Definisi skema tabel `users` untuk menyimpan data pendaftaran pengguna.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Definisi skema tabel `sessions` untuk menyimpan token login pengguna yang aktif.
 */
export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 255 }).notNull(),
  userId: int("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
