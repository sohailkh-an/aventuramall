export const ADMIN_COOKIE_NAME = 'admin_token';

export function getAdminCookieOptions(nodeEnv = process.env.NODE_ENV) {
  const isProduction = nodeEnv === 'production';

  return {
    path: '/',
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60,
  } as const;
}

export function getAdminClearCookieOptions(nodeEnv = process.env.NODE_ENV) {
  const options = getAdminCookieOptions(nodeEnv);

  return {
    path: options.path,
    secure: options.secure,
    sameSite: options.sameSite,
  } as const;
}
