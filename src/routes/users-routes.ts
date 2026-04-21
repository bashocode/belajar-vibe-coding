import { Elysia } from "elysia";
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
    const { name, email, password } = body as any;
    
    if (!name || name.length > 255) {
      set.status = 400;
      return { error: "nama tidak valid atau terlalu panjang" };
    }
    if (!email || email.length > 255) {
      set.status = 400;
      return { error: "email tidak valid atau terlalu panjang" };
    }
    if (!password || password.length > 255) {
      set.status = 400;
      return { error: "password tidak valid atau terlalu panjang" };
    }

    const result = await registerUser(name, email, password);
    if (result.error) {
        set.status = 400;
        return result;
    }
    return result;
  })
  /**
   * POST /api/users/login
   * Endpoint autentikasi, mengembalikan token sesi (UUID).
   */
  .post('/login', async ({ body, set }) => {
    const { email, password } = body as any;
    const result = await loginUser(email, password);
    if (result.error) {
      set.status = 401;
      return result;
    }
    return result;
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
  })
  /**
   * GET /api/users/token/validate
   * Endpoint untuk memeriksa apakah sebuah token valid/aktif.
   */
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
  });
