import { RouterProvider, type createBrowserRouter } from 'react-router';

import { AuthProvider } from './auth/AuthProvider';

type AppRouter = ReturnType<typeof createBrowserRouter>;

/** Root component. The router is passed in so tests can use an in-memory one. */
export function App({ router }: { router: AppRouter }) {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
