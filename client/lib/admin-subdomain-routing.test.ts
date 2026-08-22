import assert from 'node:assert/strict';

import { getAdminSubdomainRewritePath } from './admin-subdomain-routing';

assert.equal(
  getAdminSubdomainRewritePath('admin.aventuramallstores.com', '/'),
  '/admin/login'
);

assert.equal(
  getAdminSubdomainRewritePath('admin.aventuramallstores.com', '/dashboard'),
  '/admin/dashboard'
);

assert.equal(
  getAdminSubdomainRewritePath('admin.aventuramallstores.com', '/admin/dashboard'),
  '/admin/dashboard'
);

assert.equal(getAdminSubdomainRewritePath('aventuramallstores.com', '/dashboard'), null);
