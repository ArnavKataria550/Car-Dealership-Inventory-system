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

/** Same limits as the API: bcrypt only uses the first 72 bytes of a password. */
export const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_BYTES = 72;
const MAX_NAME_LENGTH = 100;

export interface RegisterValues {
  name: string;
  email: string;
  password: string;
}

export function validateRegister({
  name,
  email,
  password,
}: RegisterValues): FieldErrors<keyof RegisterValues> {
  return withoutEmpty({
    name: validateName(name),
    email: validateEmail(email),
    password: validateNewPassword(password),
  });
}

function validateName(name: string): string | undefined {
  if (name.trim() === '') return 'Name is required';
  if (name.trim().length > MAX_NAME_LENGTH) {
    return `Name must be at most ${MAX_NAME_LENGTH} characters`;
  }
  return undefined;
}

function validateNewPassword(password: string): string | undefined {
  if (password === '') return 'Password is required';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES) {
    return 'Password must be at most 72 characters';
  }
  return undefined;
}

function withoutEmpty<Field extends string>(
  errors: Record<Field, string | undefined>,
): FieldErrors<Field> {
  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => message !== undefined),
  ) as FieldErrors<Field>;
}
