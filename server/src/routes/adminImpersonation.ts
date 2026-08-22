type ImpersonationCandidate = {
  id: string;
  email: string;
  name: string;
  role: string;
  isBanned: boolean;
};

export function getImpersonationCustomerPayload(customer: ImpersonationCandidate) {
  if (customer.role !== 'CUSTOMER') {
    throw new Error('Only customer accounts can be impersonated');
  }

  if (customer.isBanned) {
    throw new Error('Cannot impersonate a banned customer');
  }

  return {
    id: customer.id,
    email: customer.email,
    name: customer.name,
    role: customer.role,
  };
}
