export function canSellerLogin(status: string | null | undefined) {
  return status !== 'SUSPENDED';
}
