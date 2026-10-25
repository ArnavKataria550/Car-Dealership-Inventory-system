import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import type { Vehicle } from '../api/vehicles';
import { buildVehicle } from '../test/fixtures';
import { server } from '../test/msw-server';
import { logInAs, renderAppAt } from '../test/render-app';

describe('AdminPage: add a vehicle', () => {
  it('creates a vehicle from the dialog, adds its row and confirms with a toast', async () => {
    let created: unknown;
    server.use(
      http.get('/api/vehicles', () => HttpResponse.json({ vehicles: [buildVehicle()] })),
      http.post('/api/vehicles', async ({ request }) => {
        created = await request.json();
        const vehicle: Vehicle = {
          ...(created as Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>),
          id: 'veh-new',
          createdAt: '2026-10-25T12:00:00.000Z',
          updatedAt: '2026-10-25T12:00:00.000Z',
        };
        return HttpResponse.json({ vehicle }, { status: 201 });
      }),
    );
    logInAs('ADMIN');
    const { user } = renderAppAt('/admin');
    await screen.findByRole('row', { name: /2023 Toyota Camry XSE/ });

    await user.click(screen.getByRole('button', { name: 'Add vehicle' }));
    const dialog = screen.getByRole('dialog', { name: 'Add a vehicle' });
    await user.type(within(dialog).getByLabelText('Make'), 'Kia');
    await user.type(within(dialog).getByLabelText('Model'), 'EV6 GT-Line');
    await user.selectOptions(within(dialog).getByLabelText('Category'), 'EV');
    await user.type(within(dialog).getByLabelText('Year'), '2024');
    await user.type(within(dialog).getByLabelText('Color'), 'Glacier White');
    await user.type(within(dialog).getByLabelText('Price (USD)'), '52900');
    await user.clear(within(dialog).getByLabelText('Quantity'));
    await user.type(within(dialog).getByLabelText('Quantity'), '3');
    await user.type(
      within(dialog).getByLabelText('Image URL'),
      'https://images.example.test/ev6.jpg',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Add vehicle' }));

    expect(await screen.findByRole('row', { name: /2024 Kia EV6 GT-Line/ })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByText('Added 2024 Kia EV6 GT-Line')).toBeInTheDocument();
    expect(created).toMatchObject({
      make: 'Kia',
      category: 'EV',
      priceCents: 5_290_000,
      quantity: 3,
    });
  });
});
