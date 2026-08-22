import assert from 'node:assert/strict';

import { buildProxyResponseHeaders } from './route';

const upstreamResponse = new Response(JSON.stringify({ ok: true }), {
  status: 200,
  headers: {
    'Content-Type': 'application/json',
    'Set-Cookie': 'admin_token=abc; Path=/; HttpOnly; Secure; SameSite=None',
  },
});

const headers = buildProxyResponseHeaders(upstreamResponse);

assert.equal(headers.get('Content-Type'), 'application/json');
assert.equal(
  headers.get('Set-Cookie'),
  'admin_token=abc; Path=/; HttpOnly; Secure; SameSite=None'
);

console.log('api proxy header assertions passed');
