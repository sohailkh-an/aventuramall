import assert from 'node:assert/strict';
import { ADMIN_THEME_STORAGE_KEY, isAdminTheme, resolveAdminTheme } from './admin-theme';

assert.equal(ADMIN_THEME_STORAGE_KEY, 'admin-theme');
assert.equal(isAdminTheme('light'), true);
assert.equal(isAdminTheme('dark'), true);
assert.equal(isAdminTheme('system'), false);
assert.equal(isAdminTheme(null), false);

assert.equal(resolveAdminTheme('light', true), 'light');
assert.equal(resolveAdminTheme('dark', false), 'dark');
assert.equal(resolveAdminTheme('invalid', true), 'dark');
assert.equal(resolveAdminTheme(null, false), 'light');

console.log('admin theme assertions passed');
