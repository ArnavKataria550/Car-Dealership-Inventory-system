import { Link } from 'react-router';

import { AuthLayout } from '../components/layout/AuthLayout';
import { RegisterForm } from '../features/auth/RegisterForm';

/** Registering also signs the user in, after which GuestOnlyRoute takes them to the inventory. */
export function RegisterPage() {
  return (
    <AuthLayout
      title="Create your account"
      subtitle="It takes less than a minute. No credit card needed."
      footer={
        <>
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-ink-950 underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
}
