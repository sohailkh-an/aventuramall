import assert from 'node:assert/strict';

import { getAdminClearCookieOptions, getAdminCookieOptions } from './adminCookie.js';

assert.deepEqual(getAdminCookieOptions('development'), {
  path: '/',
  httpOnly: true,
  secure: false,
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60,
});

assert.deepEqual(getAdminCookieOptions('production'), {
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: 7 * 24 * 60 * 60,
});

assert.deepEqual(getAdminClearCookieOptions('production'), {
  path: '/',
  secure: true,
  sameSite: 'none',
});

console.log('admin cookie option assertions passed');
