import { db } from "../db/index";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcrypt";

export const registerUser = async (name: string, email: string, password: string) => {
  // Cek apakah email sudah terdaftar
  const existingUsers = await db.select().from(users).where(eq(users.email, email));
  
  if (existingUsers.length > 0) {
    return { error: "email sudah terdaftar" };
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Simpan user baru ke database
  await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
  });
  
  return { data: "OK" };
};
