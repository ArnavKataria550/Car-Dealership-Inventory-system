import { useState, type FormEvent } from 'react';

import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/auth-context';
import type { User } from '../../auth/types';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { validateLogin, type FieldErrors, type LoginValues } from './validation';

interface LoginFormProps {
  /** Optional: routing already reacts to the login via GuestOnlyRoute. */
  onSuccess?: (user: User) => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login } = useAuth();
  const [values, setValues] = useState<LoginValues>({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<keyof LoginValues>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof LoginValues) => (event: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [field]: event.target.value }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors = validateLogin(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const user = await login(values.email.trim(), values.password);
      onSuccess?.(user);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Something went wrong.');
      setValues((current) => ({ ...current, password: '' }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {formError && <Alert>{formError}</Alert>}

      <TextField
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={values.email}
        onChange={update('email')}
        error={fieldErrors.email}
      />
      <TextField
        label="Password"
        type="password"
        name="password"
        autoComplete="current-password"
        value={values.password}
        onChange={update('password')}
        error={fieldErrors.password}
      />

      <Button type="submit" loading={submitting} loadingText="Signing in…" className="w-full">
        Sign in
      </Button>
    </form>
  );
}
