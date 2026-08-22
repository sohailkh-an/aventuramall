const DEFAULT_ADMIN_HOSTNAME = 'admin.aventuramallstores.com';

function normalizeHostname(host: string | null) {
  return host?.split(':')[0]?.toLowerCase() ?? '';
}

export function getAdminSubdomainRewritePath(
  host: string | null,
  pathname: string,
  adminHostname = process.env.ADMIN_HOSTNAME || DEFAULT_ADMIN_HOSTNAME
) {
  if (normalizeHostname(host) !== adminHostname.toLowerCase()) {
    return null;
  }

  if (pathname === '/') {
    return '/admin/login';
  }

  if (pathname.startsWith('/admin')) {
    return pathname;
  }

  return `/admin${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}
