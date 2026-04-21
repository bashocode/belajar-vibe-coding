import { db } from "../db/index";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcrypt";
import crypto from "crypto";

export type ServiceResponse<T = any> = { data?: T; error?: string; message?: string; token?: string; user_id?: number };

/**
 * Mendaftarkan user baru ke dalam database.
 * Melakukan pengecekan duplikasi email dan hashing password sebelum disimpan.
 * 
 * @param name - Nama lengkap pengguna
 * @param email - Alamat email unik pengguna
 * @param password - Password raw yang akan di-hash
 * @returns Objek response dengan data "OK" jika sukses, atau pesan error jika gagal.
 */
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

/**
 * Mengautentikasi pengguna berdasarkan email dan password.
 * Jika valid, akan membuat dan mengembalikan session token (UUID).
 * 
 * @param email - Alamat email pengguna
 * @param password - Password raw untuk diverifikasi
 * @returns Objek response berisi token jika sukses, atau pesan error jika gagal.
 */
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

/**
 * Mengakhiri sesi pengguna dengan menghapus token dari database.
 * 
 * @param token - Token sesi yang valid
 * @returns Objek pesan sukses jika berhasil, atau pesan error jika token tidak valid.
 */
export const logoutUser = async (token: string) => {
  const session = await db.select().from(sessions).where(eq(sessions.token, token));
  
  if (session.length === 0) {
    return { error: "unauthorized" };
  }
  
  await db.delete(sessions).where(eq(sessions.token, token));
  
  return { message: "logout berhasil" };
};

/**
 * Memvalidasi apakah sebuah token sesi masih aktif dan ada di database.
 * 
 * @param token - Token sesi yang akan divalidasi
 * @returns Objek response "OK" dan `user_id` jika valid, atau pesan error jika tidak.
 */
export const validateToken = async (token: string) => {
  const session = await db.select().from(sessions).where(eq(sessions.token, token));
  
  if (session.length === 0) {
    return { error: "token tidak ditemukan" };
  }
  
  return { data: "OK", user_id: session[0].userId };
};

/**
 * Mengambil data profil lengkap pengguna yang sedang aktif berdasarkan token sesi.
 * 
 * @param token - Token sesi yang valid
 * @returns Objek profil pengguna (id, name, email, created_at) atau pesan error jika token invalid.
 */
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
