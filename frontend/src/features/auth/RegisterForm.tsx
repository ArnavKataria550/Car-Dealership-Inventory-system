import { useState, type FormEvent } from 'react';

import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/auth-context';
import type { User } from '../../auth/types';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import {
  MIN_PASSWORD_LENGTH,
  validateRegister,
  type FieldErrors,
  type RegisterValues,
} from './validation';

type Field = keyof RegisterValues;
const FIELDS: Field[] = ['name', 'email', 'password'];

interface RegisterFormProps {
  /** Optional: routing already reacts to the login via GuestOnlyRoute. */
  onSuccess?: (user: User) => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register } = useAuth();
  const [values, setValues] = useState<RegisterValues>({ name: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: Field) => (event: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [field]: event.target.value }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors = validateRegister(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const user = await register(values.name.trim(), values.email.trim(), values.password);
      onSuccess?.(user);
    } catch (error) {
      showServerError(error);
    } finally {
      setSubmitting(false);
    }
  }

  /** Puts server errors next to the field they concern; anything else goes in the alert. */
  function showServerError(error: unknown) {
    if (!(error instanceof ApiError)) {
      setFormError('Something went wrong.');
      return;
    }
    if (error.code === 'CONFLICT') {
      setFieldErrors({ email: error.message });
      return;
    }
    const byField: FieldErrors<Field> = {};
    for (const detail of error.details) {
      if (FIELDS.includes(detail.field as Field)) byField[detail.field as Field] = detail.message;
    }
    if (Object.keys(byField).length > 0) {
      setFieldErrors(byField);
    } else {
      setFormError(error.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {formError && <Alert>{formError}</Alert>}

      <TextField
        label="Full name"
        name="name"
        autoComplete="name"
        placeholder="Jordan Lee"
        value={values.name}
        onChange={update('name')}
        error={fieldErrors.name}
      />
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
        autoComplete="new-password"
        hint={`At least ${MIN_PASSWORD_LENGTH} characters`}
        value={values.password}
        onChange={update('password')}
        error={fieldErrors.password}
      />

      <Button type="submit" loading={submitting} loadingText="Creating account…" className="w-full">
        Create account
      </Button>
    </form>
  );
}
