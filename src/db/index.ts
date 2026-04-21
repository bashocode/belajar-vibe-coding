import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

/**
 * Membuat koneksi ke database MySQL menggunakan konfigurasi URL dari environment variable.
 * Fallback URL mengarah ke database lokal `vibe_coding_db` dengan user `root`.
 */
const connection = await mysql.createConnection(
  process.env.DATABASE_URL || "mysql://root:@localhost:3306/vibe_coding_db"
);

/**
 * Instance Drizzle ORM yang sudah terhubung dengan database MySQL.
 * Gunakan instance ini (`db`) untuk melakukan query ke database.
 */
export const db = drizzle(connection, { schema, mode: "default" });
