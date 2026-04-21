export const extractToken = (headers: Record<string, string | undefined>): string | null => {
  const authHeader = headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.substring(7);
};
