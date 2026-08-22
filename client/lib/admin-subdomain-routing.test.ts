import assert from 'node:assert/strict';

import { getAdminSubdomainRewritePath } from './admin-subdomain-routing';

assert.equal(
  getAdminSubdomainRewritePath('admin.tiktokshopstores.com', '/'),
  '/admin/login'
);

assert.equal(
  getAdminSubdomainRewritePath('admin.tiktokshopstores.com', '/dashboard'),
  '/admin/dashboard'
);

assert.equal(
  getAdminSubdomainRewritePath('admin.tiktokshopstores.com', '/admin/dashboard'),
  '/admin/dashboard'
);

assert.equal(getAdminSubdomainRewritePath('tiktokshopstores.com', '/dashboard'), null);
