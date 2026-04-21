import { Elysia } from "elysia";
import { registerUser, loginUser, logoutUser, validateToken, getCurrentUser } from "../services/users-services";
import { extractToken } from "../utils/auth-helper";

export const usersRoutes = new Elysia({ prefix: '/api/users' })
  .onError(({ code, error, set }) => {
    return { error: error.message || "Internal Server Error" };
  })
  .post('', async ({ body, set }) => {
    const { name, email, password } = body as any;
    const result = await registerUser(name, email, password);
    if (result.error) {
        set.status = 400;
        return result;
    }
    return result;
  })
  .post('/login', async ({ body, set }) => {
    const { email, password } = body as any;
    const result = await loginUser(email, password);
    if (result.error) {
      set.status = 401;
      return result;
    }
    return result;
  })
  .delete('/logout', async ({ headers, set }) => {
    const token = extractToken(headers);
    if (!token) {
      set.status = 401;
      return { error: "unauthorized" };
    }
    const result = await logoutUser(token);
    if (result.error) {
      set.status = 401;
      return result;
    }
    return result;
  })
  .get('/token/validate', async ({ body, query, set }) => {
    const token = (body as any)?.token || query.token;
    if (!token) {
      set.status = 400;
      return { error: "token tidak disediakan" };
    }
    const result = await validateToken(token);
    if (result.error) {
      set.status = 401;
      return result;
    }
    return result;
  })
  .get('/me', async ({ headers, set }) => {
    const token = extractToken(headers);
    if (!token) {
      set.status = 401;
      return { error: "unauthorized" };
    }
    const result = await getCurrentUser(token);
    if (result.error) {
      set.status = 401;
      return result;
    }
    return result;
  });
