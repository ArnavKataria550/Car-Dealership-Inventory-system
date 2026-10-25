/**
 * Client-side checks that mirror the API's rules, so most mistakes are caught
 * before a request is made. The server still validates everything.
 */
export type FieldErrors<Field extends string> = Partial<Record<Field, string>>;

// Deliberately simple: the server does the authoritative email check.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | undefined {
  if (email.trim() === '') return 'Email is required';
  if (!EMAIL_PATTERN.test(email.trim())) return 'Enter a valid email address';
  return undefined;
}

export interface LoginValues {
  email: string;
  password: string;
}

export function validateLogin({ email, password }: LoginValues): FieldErrors<keyof LoginValues> {
  return withoutEmpty({
    email: validateEmail(email),
    password: password === '' ? 'Password is required' : undefined,
  });
}

function withoutEmpty<Field extends string>(
  errors: Record<Field, string | undefined>,
): FieldErrors<Field> {
  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => message !== undefined),
  ) as FieldErrors<Field>;
}
