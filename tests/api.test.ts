import { describe, it, expect, beforeEach } from "bun:test";
import { app } from "../src/index";
import { db } from "../src/db/index";
import { users, sessions } from "../src/db/schema";

describe("API Unit Tests", () => {
  // Bersihkan data sebelum setiap test
  beforeEach(async () => {
    await db.delete(sessions);
    await db.delete(users);
  });

  const baseUrl = "http://localhost:3000/api/users";

  describe("1. Registrasi User (POST /api/users)", () => {
    it("[Success] Pendaftaran user baru", async () => {
      const response = await app.handle(
        new Request(baseUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "John Doe",
            email: "john@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ data: "OK" });
    });

    it("[Error] Email sudah terdaftar", async () => {
      // Daftarkan user pertama
      await app.handle(
        new Request(baseUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "John",
            email: "john@example.com",
            password: "password123",
          }),
        })
      );

      // Coba daftar dengan email yang sama
      const response = await app.handle(
        new Request(baseUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "John duplicate",
            email: "john@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("email sudah terdaftar");
    });

    it("[Error] Nama terlalu panjang (> 255)", async () => {
      const longName = "a".repeat(256);
      const response = await app.handle(
        new Request(baseUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: longName,
            email: "long@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("nama tidak valid atau terlalu panjang");
    });
  });

  describe("2. Login User (POST /api/users/login)", () => {
    beforeEach(async () => {
      // Daftarkan user untuk keperluan login
      await app.handle(
        new Request(baseUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "John",
            email: "john@example.com",
            password: "password123",
          }),
        })
      );
    });

    it("[Success] Login berhasil", async () => {
      const response = await app.handle(
        new Request(`${baseUrl}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "john@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.token).toBeDefined();
    });

    it("[Error] Email tidak terdaftar", async () => {
      const response = await app.handle(
        new Request(`${baseUrl}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "wrong@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("email atau password salah");
    });
  });

  describe("3. Validasi Token dan Get Me", () => {
    let token: string;

    beforeEach(async () => {
      await app.handle(
        new Request(baseUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "John",
            email: "john@example.com",
            password: "password123",
          }),
        })
      );

      const loginRes = await app.handle(
        new Request(`${baseUrl}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "john@example.com",
            password: "password123",
          }),
        })
      );
      const loginBody = await loginRes.json();
      token = loginBody.token;
    });

    it("[Success] Validasi token", async () => {
      const response = await app.handle(
        new Request(`${baseUrl}/token/validate?token=${token}`, {
          method: "GET",
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toBe("OK");
    });

    it("[Success] Get current user profile", async () => {
      const response = await app.handle(
        new Request(`${baseUrl}/me`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.email).toBe("john@example.com");
    });

    it("[Error] Get me tanpa header", async () => {
      const response = await app.handle(
        new Request(`${baseUrl}/me`, { method: "GET" })
      );

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("unauthorized");
    });
  });

  describe("4. Logout User (DELETE /api/users/logout)", () => {
    let token: string;

    beforeEach(async () => {
      await app.handle(
        new Request(baseUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "John",
            email: "john@example.com",
            password: "password123",
          }),
        })
      );

      const loginRes = await app.handle(
        new Request(`${baseUrl}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "john@example.com",
            password: "password123",
          }),
        })
      );
      const loginBody = await loginRes.json();
      token = loginBody.token;
    });

    it("[Success] Logout berhasil", async () => {
      const response = await app.handle(
        new Request(`${baseUrl}/logout`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.message).toBe("logout berhasil");
    });

    it("[Error] Logout ulang dengan token yang sama", async () => {
      // Logout pertama
      await app.handle(
        new Request(`${baseUrl}/logout`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      // Logout kedua
      const response = await app.handle(
        new Request(`${baseUrl}/logout`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("unauthorized");
    });
  });
});
