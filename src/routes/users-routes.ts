import { Elysia, t } from "elysia";
import { registerUser, loginUser, logoutUser, validateToken, getCurrentUser } from "../services/users-services";
import { extractToken } from "../utils/auth-helper";

/**
 * Modul Router untuk entitas User.
 * Menangani semua endpoint API di bawah prefix `/api/users`.
 */
export const usersRoutes = new Elysia({ prefix: '/api/users' })
  // Handler error global untuk memastikan response format konsisten saat terjadi crash/exception
  .onError(({ code, error, set }) => {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return { error: message };
  })
  /**
   * POST /api/users
   * Endpoint registrasi user baru.
   */
  .post('', async ({ body, set }) => {
    const { name, email, password } = body;
    
    if (name.length > 255) {
      set.status = 400;
      return { error: "nama tidak valid atau terlalu panjang" };
    }
    if (email.length > 255) {
      set.status = 400;
      return { error: "email tidak valid atau terlalu panjang" };
    }
    if (password.length > 255) {
      set.status = 400;
      return { error: "password tidak valid atau terlalu panjang" };
    }

    const result = await registerUser(name, email, password);
    if (result.error) {
        set.status = 400;
        return result;
    }
    return result;
  }, {
    body: t.Object({
        name: t.String({ maxLength: 255, default: 'John Doe' }),
        email: t.String({ format: 'email', maxLength: 255, default: 'john@example.com' }),
        password: t.String({ minLength: 8, maxLength: 255, default: 'password123' })
    }),
    response: {
        200: t.Object({ data: t.String() }),
        400: t.Object({ error: t.String() })
    },
    detail: {
        summary: 'Registrasi User Baru',
        tags: ['Users']
    }
  })
  /**
   * POST /api/users/login
   * Endpoint autentikasi, mengembalikan token sesi (UUID).
   */
  .post('/login', async ({ body, set }) => {
    const { email, password } = body;
    const result = await loginUser(email, password);
    if (result.error) {
      set.status = 401;
      return result;
    }
    return result;
  }, {
    body: t.Object({
        email: t.String({ format: 'email', default: 'john@example.com' }),
        password: t.String({ default: 'password123' })
    }),
    response: {
        200: t.Object({ token: t.String() }),
        401: t.Object({ error: t.String() })
    },
    detail: {
        summary: 'Login User',
        tags: ['Users']
    }
  })
  /**
   * DELETE /api/users/logout
   * Endpoint untuk mengakhiri sesi, memerlukan header Authorization Bearer token.
   */
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
  }, {
    headers: t.Object({
        authorization: t.String({ default: 'Bearer <token>' })
    }),
    response: {
        200: t.Object({ message: t.String() }),
        401: t.Object({ error: t.String() })
    },
    detail: {
        summary: 'Logout User',
        tags: ['Users']
    }
  })
  /**
   * GET /api/users/token/validate
   * Endpoint untuk memeriksa apakah sebuah token valid/aktif.
   */
  .get('/token/validate', async ({ query, set }) => {
    const { token } = query;
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
  }, {
    query: t.Object({
        token: t.String({ default: 'uuid-token-here' })
    }),
    response: {
        200: t.Object({ data: t.String(), user_id: t.Number() }),
        401: t.Object({ error: t.String() })
    },
    detail: {
        summary: 'Validasi Token Sesi',
        tags: ['Users']
    }
  })
  /**
   * GET /api/users/me
   * Endpoint untuk mendapatkan data profil lengkap pengguna yang login saat ini.
   */
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
  }, {
    headers: t.Object({
        authorization: t.String({ default: 'Bearer <token>' })
    }),
    response: {
        200: t.Object({
            id: t.Number(),
            name: t.String(),
            email: t.String(),
            created_at: t.Any()
        }),
        401: t.Object({ error: t.String() })
    },
    detail: {
        summary: 'Dapatkan Profil User Aktif',
        tags: ['Users']
    }
  });
