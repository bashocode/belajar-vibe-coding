import { Elysia } from "elysia";
import { usersRoutes } from "./routes/users-routes";

export const app = new Elysia()
  .use(usersRoutes)
  .get("/", () => "Hello Elysia")
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
