interface ValidateSellerTransactionPasswordChangeInput {
  storedTransactionPassword: string | null | undefined;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  comparePassword: (plainPassword: string, hashedPassword: string) => Promise<boolean>;
}

type SellerTransactionPasswordValidationResult =
  | { ok: true }
  | { ok: false; statusCode: number; error: string };

export async function validateSellerTransactionPasswordChange({
  storedTransactionPassword,
  currentPassword,
  newPassword,
  confirmPassword,
  comparePassword,
}: ValidateSellerTransactionPasswordChangeInput): Promise<SellerTransactionPasswordValidationResult> {
  if (!storedTransactionPassword) {
    return { ok: false, statusCode: 400, error: 'Current transaction password is not set.' };
  }

  if (newPassword !== confirmPassword) {
    return { ok: false, statusCode: 400, error: 'New transaction passwords do not match.' };
  }

  const isCurrentPasswordValid = await comparePassword(currentPassword, storedTransactionPassword);

  if (!isCurrentPasswordValid) {
    return { ok: false, statusCode: 400, error: 'Invalid current transaction password.' };
  }

  return { ok: true };
}

interface ValidateSellerTransactionPasswordResetInput {
  newPassword: string;
  confirmPassword: string;
}

export async function validateSellerTransactionPasswordReset({
  newPassword,
  confirmPassword,
}: ValidateSellerTransactionPasswordResetInput): Promise<SellerTransactionPasswordValidationResult> {
  if (newPassword !== confirmPassword) {
    return { ok: false, statusCode: 400, error: 'New transaction passwords do not match.' };
  }

  return { ok: true };
}
