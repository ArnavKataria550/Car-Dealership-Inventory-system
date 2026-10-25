import { Link } from 'react-router';

import { useAuth } from '../auth/auth-context';
import { Alert } from '../components/ui/Alert';
import { AuthLayout } from '../components/layout/AuthLayout';
import { BRAND_NAME } from '../config/brand';
import { LoginForm } from '../features/auth/LoginForm';

/** After a successful login, GuestOnlyRoute sends the user on to the page they wanted. */
export function LoginPage() {
  const { sessionMessage } = useAuth();

  return (
    <AuthLayout
      title="Welcome back"
      subtitle={`Sign in to browse and buy from the ${BRAND_NAME} inventory.`}
      footer={
        <>
          New to {BRAND_NAME}?{' '}
          <Link
            to="/register"
            className="font-semibold text-ink-950 underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      {sessionMessage && (
        <div className="mb-6">
          <Alert tone="info">{sessionMessage}</Alert>
        </div>
      )}
      <LoginForm />
    </AuthLayout>
  );
}
