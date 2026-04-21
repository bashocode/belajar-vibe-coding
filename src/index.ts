import { Elysia } from "elysia";
import { usersRoutes } from "./routes/users-routes";
import { swagger } from "@elysiajs/swagger";

/**
 * Instance utama aplikasi Elysia.
 * Mendaftarkan routing aplikasi, termasuk endpoint health-check dasar dan dokumentasi Swagger.
 */
export const app = new Elysia()
  .use(swagger({
    path: '/swagger',
    documentation: {
      info: {
        title: 'API Documentation Belajar Vibe Coding',
        version: '1.0.0',
        description: 'Dokumentasi interaktif untuk aplikasi sistem autentikasi user'
      }
    }
  }))
  .use(usersRoutes)
  .get("/", () => "Hello Elysia")
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
