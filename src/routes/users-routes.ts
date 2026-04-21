import { Elysia } from "elysia";
import { registerUser, loginUser, logoutUser, validateToken } from "../services/users-services";

export const usersRoutes = new Elysia({ prefix: '/api/users' })
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
      set.status = 401; // Unauthorized
      return result;
    }
    return result;
  })
  .post('/logout', async ({ body, set }) => {
    const { token } = body as any;
    const result = await logoutUser(token);
    
    if (result.error) {
      set.status = 404; // Not Found
      return result;
    }
    return result;
  })
  .get('/token/validate', async ({ body, query, set }) => {
    // Baca token dari body (atau query jika body kosong)
    const token = (body as any)?.token || query.token;
    
    if (!token) {
      set.status = 400;
      return { error: "token tidak disediakan" };
    }

    const result = await validateToken(token);
    
    if (result.error) {
      set.status = 401; // Unauthorized
      return result;
    }
    return result;
  });
