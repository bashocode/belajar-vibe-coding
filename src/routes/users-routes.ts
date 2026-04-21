import { Elysia } from "elysia";
import { registerUser } from "../services/users-services";

export const usersRoutes = new Elysia({ prefix: '/api' })
  .post('/users', async ({ body, set }) => {
    const { name, email, password } = body as any;
    
    const result = await registerUser(name, email, password);
    
    if (result.error) {
        set.status = 400;
        return result;
    }
    
    return result;
  });
