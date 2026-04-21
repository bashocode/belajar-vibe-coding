import { db } from "../db/index";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcrypt";
import crypto from "crypto";

export type ServiceResponse<T = any> = { data?: T; error?: string; message?: string; token?: string; user_id?: number };

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

export const loginUser = async (email: string, password: string) => {
  const user = await db.select().from(users).where(eq(users.email, email));
  
  if (user.length === 0) {
    return { error: "email atau password salah" };
  }
  
  const isPasswordMatch = await bcrypt.compare(password, user[0].password);
  
  if (!isPasswordMatch) {
    return { error: "email atau password salah" };
  }
  
  const token = crypto.randomUUID();
  
  await db.insert(sessions).values({
    token,
    userId: user[0].id,
  });
  
  return { token };
};

export const logoutUser = async (token: string) => {
  const session = await db.select().from(sessions).where(eq(sessions.token, token));
  
  if (session.length === 0) {
    return { error: "unauthorized" };
  }
  
  await db.delete(sessions).where(eq(sessions.token, token));
  
  return { message: "logout berhasil" };
};

export const validateToken = async (token: string) => {
  const session = await db.select().from(sessions).where(eq(sessions.token, token));
  
  if (session.length === 0) {
    return { error: "token tidak ditemukan" };
  }
  
  return { data: "OK", user_id: session[0].userId };
};

export const getCurrentUser = async (token: string) => {
  const session = await db.select().from(sessions).where(eq(sessions.token, token));
  
  if (session.length === 0) {
    return { error: "unauthorized" };
  }
  
  const user = await db.select().from(users).where(eq(users.id, session[0].userId));
  
  if (user.length === 0) {
    return { error: "unauthorized" };
  }
  
  return {
    id: user[0].id,
    name: user[0].name,
    email: user[0].email,
    created_at: user[0].createdAt
  };
};
