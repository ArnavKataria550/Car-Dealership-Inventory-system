import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import type { Vehicle } from '../api/vehicles';
import { buildVehicle } from '../test/fixtures';
import { server } from '../test/msw-server';
import { logInAs, renderAppAt } from '../test/render-app';

const camry = buildVehicle({ priceCents: 3_099_500, color: 'Celestial Silver' });

/** Serves one vehicle and applies PUTs to it, recording each request body. */
function serveCamry() {
  let current: Vehicle = { ...camry };
  const updates: unknown[] = [];
  server.use(
    http.get('/api/vehicles', () => HttpResponse.json({ vehicles: [current] })),
    http.put('/api/vehicles/:id', async ({ request }) => {
      const changes = (await request.json()) as Partial<Vehicle>;
      updates.push(changes);
      current = { ...current, ...changes, updatedAt: '2026-10-25T13:00:00.000Z' };
      return HttpResponse.json({ vehicle: current });
    }),
  );
  return updates;
}

describe('editing a vehicle', () => {
  it('from the admin table: sends only the changed fields and updates the row', async () => {
    const updates = serveCamry();
    logInAs('ADMIN');
    const { user } = renderAppAt('/admin');

    const row = await screen.findByRole('row', { name: /2023 Toyota Camry XSE/ });
    await user.click(within(row).getByRole('button', { name: 'Edit 2023 Toyota Camry XSE' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit 2023 Toyota Camry XSE' });
    expect(within(dialog).getByLabelText('Price (USD)')).toHaveValue('30995');

    await user.clear(within(dialog).getByLabelText('Price (USD)'));
    await user.type(within(dialog).getByLabelText('Price (USD)'), '29,995');
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(updates).toEqual([{ priceCents: 2_999_500 }]);
    expect(within(row).getByText('$29,995')).toBeInTheDocument();
    expect(screen.getByText('Saved 2023 Toyota Camry XSE')).toBeInTheDocument();
  });

  it('closes without a request when nothing was changed', async () => {
    const updates = serveCamry();
    logInAs('ADMIN');
    const { user } = renderAppAt('/admin');

    const row = await screen.findByRole('row', { name: /2023 Toyota Camry XSE/ });
    await user.click(within(row).getByRole('button', { name: 'Edit 2023 Toyota Camry XSE' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(updates).toEqual([]);
  });

  it('from the inventory card shortcut: updates the card', async () => {
    const updates = serveCamry();
    logInAs('ADMIN');
    const { user } = renderAppAt('/');

    const card = await screen.findByRole('article', { name: '2023 Toyota Camry XSE' });
    await user.click(within(card).getByRole('button', { name: 'Edit 2023 Toyota Camry XSE' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit 2023 Toyota Camry XSE' });
    await user.clear(within(dialog).getByLabelText('Color'));
    await user.type(within(dialog).getByLabelText('Color'), 'Midnight Black');
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    expect(await within(card).findByText('Midnight Black')).toBeInTheDocument();
    expect(updates).toEqual([{ color: 'Midnight Black' }]);
  });

  it('keeps the dialog open with the error if saving fails', async () => {
    serveCamry();
    server.use(
      http.put('/api/vehicles/:id', () =>
        HttpResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Vehicle not found' } },
          { status: 404 },
        ),
      ),
    );
    logInAs('ADMIN');
    const { user } = renderAppAt('/admin');

    const row = await screen.findByRole('row', { name: /2023 Toyota Camry XSE/ });
    await user.click(within(row).getByRole('button', { name: 'Edit 2023 Toyota Camry XSE' }));
    const dialog = screen.getByRole('dialog');
    await user.clear(within(dialog).getByLabelText('Color'));
    await user.type(within(dialog).getByLabelText('Color'), 'Red');
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Vehicle not found');
  });
});
