/**
 * USE-P2-011: one shared statement of the password rule the API actually
 * enforces (`validatePasswordStrength` in apps/api/src/routes/auth.ts requires a
 * zxcvbn score of at least 3). Used by signup, password reset, and the profile
 * change-password form so none of them advertise a weaker rule.
 */
export const PASSWORD_POLICY_HINT =
  "Use a strong password: the server rejects weak or common passwords. A long passphrase or a mix of upper/lowercase letters, numbers, and symbols works best.";

type Props = {
  className?: string;
};

export default function PasswordPolicyHint({
  className = "mt-2 text-xs text-slate-400",
}: Props) {
  return (
    <p className={className} data-testid="password-policy-hint">
      {PASSWORD_POLICY_HINT}
    </p>
  );
}
