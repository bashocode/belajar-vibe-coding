/**
 * Mengekstrak token JWT/Bearer dari header Authorization HTTP.
 * 
 * @param headers - Objek Record yang berisi header HTTP request.
 * @returns {string | null} String token jika format valid ('Bearer <token>'), atau null jika tidak valid/kosong.
 */
export const extractToken = (headers: Record<string, string | undefined>): string | null => {
  const authHeader = headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.substring(7);
};
