import type { RouteObject } from 'react-router';

import { AppShell } from '../components/layout/AppShell';
import { AdminPage } from '../pages/AdminPage';
import { InventoryPage } from '../pages/InventoryPage';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { RegisterPage } from '../pages/RegisterPage';
import { VehicleDetailsPage } from '../pages/VehicleDetailsPage';
import { AdminRoute, GuestOnlyRoute, ProtectedRoute } from './guards';

/**
 * The whole route table. main.tsx mounts it in a browser router; tests mount
 * the same table in a memory router.
 */
export const appRoutes: RouteObject[] = [
  {
    element: <GuestOnlyRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <InventoryPage /> },
          { path: '/vehicles/:id', element: <VehicleDetailsPage /> },
          {
            element: <AdminRoute />,
            children: [{ path: '/admin', element: <AdminPage /> }],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];
