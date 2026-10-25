import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';

import { AuthProvider } from '../auth/AuthProvider';

/** Renders a component inside AuthProvider and returns a user-event instance alongside RTL's result. */
export function renderWithAuth(ui: ReactElement, options?: RenderOptions) {
  return {
    user: userEvent.setup(),
    ...render(<AuthProvider>{ui}</AuthProvider>, options),
  };
}
