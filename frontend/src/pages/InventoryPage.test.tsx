import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import type { Vehicle } from '../api/vehicles';
import { buildVehicle } from '../test/fixtures';
import { server } from '../test/msw-server';
import { logInAs, renderAppAt } from '../test/render-app';

const camry = buildVehicle();
const tucson = buildVehicle({
  id: 'veh-tucson',
  make: 'Hyundai',
  model: 'Tucson SEL',
  category: 'SUV',
  year: 2022,
  quantity: 2,
});
const mustang = buildVehicle({
  id: 'veh-mustang',
  make: 'Ford',
  model: 'Mustang Convertible',
  category: 'CONVERTIBLE',
  year: 2018,
  quantity: 0,
});

function serveVehicles(vehicles: Vehicle[]) {
  server.use(http.get('/api/vehicles', () => HttpResponse.json({ vehicles })));
}

describe('InventoryPage', () => {
  it('shows loading placeholders while the vehicles are being fetched', async () => {
    let release!: () => void;
    server.use(
      http.get('/api/vehicles', async () => {
        await new Promise<void>((resolve) => (release = resolve));
        return HttpResponse.json({ vehicles: [camry] });
      }),
    );
    logInAs('USER');
    renderAppAt('/');

    expect(await screen.findByText('Loading vehicles…')).toBeInTheDocument();
    release();
    expect(
      await screen.findByRole('article', { name: '2023 Toyota Camry XSE' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Loading vehicles…')).not.toBeInTheDocument();
  });

  it('shows a card for every vehicle, including sold-out ones', async () => {
    serveVehicles([camry, tucson, mustang]);
    logInAs('USER');
    renderAppAt('/');

    const cards = await screen.findAllByRole('article');
    expect(cards.map((card) => within(card).getByRole('heading').textContent)).toEqual([
      '2023 Toyota Camry XSE',
      '2022 Hyundai Tucson SEL',
      '2018 Ford Mustang Convertible',
    ]);
    const mustangCard = screen.getByRole('article', { name: '2018 Ford Mustang Convertible' });
    expect(within(mustangCard).getByRole('button', { name: /sold out/i })).toBeDisabled();
  });

  it('summarises how many vehicles there are and how many are in stock', async () => {
    serveVehicles([camry, tucson, mustang]);
    logInAs('USER');
    renderAppAt('/');

    expect(await screen.findByText('3 vehicles · 2 in stock')).toBeInTheDocument();
  });

  it('explains when there are no vehicles at all', async () => {
    serveVehicles([]);
    logInAs('USER');
    renderAppAt('/');

    expect(await screen.findByRole('heading', { name: /no vehicles yet/i })).toBeInTheDocument();
  });

  it('shows the error and recovers when Retry is pressed', async () => {
    let attempts = 0;
    server.use(
      http.get('/api/vehicles', () => {
        attempts += 1;
        return attempts === 1
          ? HttpResponse.json(
              { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
              { status: 500 },
            )
          : HttpResponse.json({ vehicles: [camry] });
      }),
    );
    logInAs('USER');
    const { user } = renderAppAt('/');

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't load the inventory/i);
    await user.click(screen.getByRole('button', { name: /retry/i }));

    expect(
      await screen.findByRole('article', { name: '2023 Toyota Camry XSE' }),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
});
