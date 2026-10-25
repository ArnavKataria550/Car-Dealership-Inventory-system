import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import type { Vehicle } from '../api/vehicles';
import { buildVehicle } from '../test/fixtures';
import { server } from '../test/msw-server';
import { logInAs, renderAppAt } from '../test/render-app';

const camry = buildVehicle({ quantity: 4 });
const tucson = buildVehicle({
  id: 'veh-tucson',
  make: 'Hyundai',
  model: 'Tucson SEL',
  category: 'SUV',
  year: 2022,
  quantity: 1,
});

/** A tiny in-memory stand-in for the API's stock, so purchases really change it. */
function serveStock(initial: Vehicle[]) {
  const stock = new Map(initial.map((v) => [v.id, { ...v }]));
  server.use(
    http.get('/api/vehicles', () => HttpResponse.json({ vehicles: [...stock.values()] })),
    http.post('/api/vehicles/:id/purchase', ({ params }) => {
      const vehicle = stock.get(params.id as string);
      if (!vehicle) {
        return HttpResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Vehicle not found' } },
          { status: 404 },
        );
      }
      if (vehicle.quantity === 0) {
        return HttpResponse.json(
          { error: { code: 'INSUFFICIENT_STOCK', message: 'This vehicle is out of stock' } },
          { status: 409 },
        );
      }
      vehicle.quantity -= 1;
      return HttpResponse.json({ vehicle });
    }),
  );
  return stock;
}

const card = (name: string) => screen.findByRole('article', { name });

describe('one-click purchase', () => {
  it('buys one unit, updates the card in place and confirms with a toast', async () => {
    serveStock([camry, tucson]);
    logInAs('USER');
    const { user } = renderAppAt('/');

    const camryCard = await card('2023 Toyota Camry XSE');
    await user.click(within(camryCard).getByRole('button', { name: 'Purchase' }));

    expect(await within(camryCard).findByText('3 in stock')).toBeInTheDocument();
    expect(screen.getByText('You bought a 2023 Toyota Camry XSE')).toBeInTheDocument();
    expect(screen.getByText('2 vehicles · 2 in stock')).toBeInTheDocument();
  });

  it('buying the last unit marks the car sold out', async () => {
    serveStock([camry, tucson]);
    logInAs('USER');
    const { user } = renderAppAt('/');

    const tucsonCard = await card('2022 Hyundai Tucson SEL');
    await user.click(within(tucsonCard).getByRole('button', { name: 'Purchase' }));

    expect(await within(tucsonCard).findByRole('button', { name: 'Sold out' })).toBeDisabled();
    expect(screen.getByText('2 vehicles · 1 in stock')).toBeInTheDocument();
  });

  it('shows "Buying…" only on the card being bought', async () => {
    let release!: () => void;
    serveStock([camry, tucson]);
    server.use(
      http.post('/api/vehicles/:id/purchase', async () => {
        await new Promise<void>((resolve) => (release = resolve));
        return HttpResponse.json({ vehicle: { ...camry, quantity: 3 } });
      }),
    );
    logInAs('USER');
    const { user } = renderAppAt('/');

    const camryCard = await card('2023 Toyota Camry XSE');
    await user.click(within(camryCard).getByRole('button', { name: 'Purchase' }));

    expect(within(camryCard).getByRole('button', { name: 'Buying…' })).toBeDisabled();
    const tucsonCard = screen.getByRole('article', { name: '2022 Hyundai Tucson SEL' });
    expect(within(tucsonCard).getByRole('button', { name: 'Purchase' })).toBeEnabled();
    release();
    expect(await within(camryCard).findByText('3 in stock')).toBeInTheDocument();
  });

  it('when someone else bought it first, explains and refreshes the stock', async () => {
    const stock = serveStock([camry, tucson]);
    logInAs('USER');
    const { user } = renderAppAt('/');
    const tucsonCard = await card('2022 Hyundai Tucson SEL');

    stock.get('veh-tucson')!.quantity = 0; // another customer buys it meanwhile
    await user.click(within(tucsonCard).getByRole('button', { name: 'Purchase' }));

    expect(await screen.findByText('This vehicle is out of stock')).toBeInTheDocument();
    await waitFor(() =>
      expect(
        within(screen.getByRole('article', { name: '2022 Hyundai Tucson SEL' })).getByRole(
          'button',
          { name: 'Sold out' },
        ),
      ).toBeDisabled(),
    );
  });

  it('when the vehicle was removed meanwhile, explains and drops its card', async () => {
    const stock = serveStock([camry, tucson]);
    logInAs('USER');
    const { user } = renderAppAt('/');
    const camryCard = await card('2023 Toyota Camry XSE');

    stock.delete('veh-camry'); // an admin deletes it meanwhile
    await user.click(within(camryCard).getByRole('button', { name: 'Purchase' }));

    expect(await screen.findByText('Vehicle not found')).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByRole('article', { name: '2023 Toyota Camry XSE' }),
      ).not.toBeInTheDocument(),
    );
  });
});
