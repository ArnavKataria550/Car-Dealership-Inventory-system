import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import type { Vehicle } from '../api/vehicles';
import { buildVehicle } from '../test/fixtures';
import { server } from '../test/msw-server';
import { logInAs, renderAppAt } from '../test/render-app';

const camry = buildVehicle({ quantity: 4 });
const mustang = buildVehicle({
  id: 'veh-mustang',
  make: 'Ford',
  model: 'Mustang Convertible',
  category: 'CONVERTIBLE',
  year: 2018,
  quantity: 0,
});

/** In-memory stock that restocks really change; records each restock body. */
function serveLot() {
  const lot = new Map<string, Vehicle>([camry, mustang].map((v) => [v.id, { ...v }]));
  const restocks: unknown[] = [];
  server.use(
    http.get('/api/vehicles', () => HttpResponse.json({ vehicles: [...lot.values()] })),
    http.post('/api/vehicles/:id/restock', async ({ params, request }) => {
      const body = (await request.json()) as { quantity: number };
      restocks.push(body);
      const vehicle = lot.get(params.id as string)!;
      vehicle.quantity += body.quantity;
      return HttpResponse.json({ vehicle });
    }),
  );
  return restocks;
}

describe('restocking a vehicle', () => {
  it('from the admin table: adds the units and updates the row', async () => {
    const restocks = serveLot();
    logInAs('ADMIN');
    const { user } = renderAppAt('/admin');

    const row = await screen.findByRole('row', { name: /2023 Toyota Camry XSE/ });
    await user.click(within(row).getByRole('button', { name: 'Restock 2023 Toyota Camry XSE' }));
    const dialog = screen.getByRole('dialog', { name: 'Restock 2023 Toyota Camry XSE' });
    expect(dialog).toHaveTextContent('Currently 4 in stock');
    expect(within(dialog).getByLabelText('Units to add')).toHaveValue('1');

    await user.clear(within(dialog).getByLabelText('Units to add'));
    await user.type(within(dialog).getByLabelText('Units to add'), '5');
    await user.click(within(dialog).getByRole('button', { name: 'Add stock' }));

    expect(await within(row).findByText('9 in stock')).toBeInTheDocument();
    expect(restocks).toEqual([{ quantity: 5 }]);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByText('Restocked 2023 Toyota Camry XSE: now 9 in stock')).toBeInTheDocument();
  });

  it.each([['0'], ['101'], ['1.5'], ['lots']])(
    'rejects %j units without calling the API',
    async (units) => {
      const restocks = serveLot();
      logInAs('ADMIN');
      const { user } = renderAppAt('/admin');

      const row = await screen.findByRole('row', { name: /2023 Toyota Camry XSE/ });
      await user.click(within(row).getByRole('button', { name: /restock/i }));
      const input = within(screen.getByRole('dialog')).getByLabelText('Units to add');
      await user.clear(input);
      await user.type(input, units);
      await user.click(screen.getByRole('button', { name: 'Add stock' }));

      expect(input).toHaveAccessibleDescription('Enter a whole number from 1 to 100');
      expect(restocks).toEqual([]);
    },
  );

  it('from a sold-out inventory card: puts the car back in stock', async () => {
    serveLot();
    logInAs('ADMIN');
    const { user } = renderAppAt('/');

    const card = await screen.findByRole('article', { name: '2018 Ford Mustang Convertible' });
    expect(within(card).getByText('Sold out')).toBeInTheDocument();
    await user.click(within(card).getByRole('button', { name: /restock/i }));
    const input = within(screen.getByRole('dialog')).getByLabelText('Units to add');
    await user.clear(input);
    await user.type(input, '2');
    await user.click(screen.getByRole('button', { name: 'Add stock' }));

    expect(await within(card).findByText('Only 2 left')).toBeInTheDocument();
  });

  it('shows a failed restock inside the dialog', async () => {
    serveLot();
    server.use(
      http.post('/api/vehicles/:id/restock', () =>
        HttpResponse.json(
          {
            error: { code: 'CONFLICT', message: 'Restock would exceed the maximum stock level' },
          },
          { status: 409 },
        ),
      ),
    );
    logInAs('ADMIN');
    const { user } = renderAppAt('/admin');

    const row = await screen.findByRole('row', { name: /2023 Toyota Camry XSE/ });
    await user.click(within(row).getByRole('button', { name: /restock/i }));
    await user.click(screen.getByRole('button', { name: 'Add stock' }));

    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent(
      'Restock would exceed the maximum stock level',
    );
  });
});
