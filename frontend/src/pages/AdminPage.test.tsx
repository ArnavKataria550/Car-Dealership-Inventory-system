import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import type { Vehicle } from '../api/vehicles';
import { buildVehicle } from '../test/fixtures';
import { server } from '../test/msw-server';
import { logInAs, renderAppAt } from '../test/render-app';

const camry = buildVehicle({ quantity: 4, priceCents: 3_099_500 });
const mustang = buildVehicle({
  id: 'veh-mustang',
  make: 'Ford',
  model: 'Mustang Convertible',
  category: 'CONVERTIBLE',
  year: 2018,
  priceCents: 3_290_000,
  quantity: 0,
});

/** In-memory stand-in for the API so deletes really remove vehicles. */
function serveLot(initial: Vehicle[]) {
  const lot = new Map(initial.map((v) => [v.id, v]));
  const deleted: string[] = [];
  server.use(
    http.get('/api/vehicles', () => HttpResponse.json({ vehicles: [...lot.values()] })),
    http.delete('/api/vehicles/:id', ({ params }) => {
      const id = params.id as string;
      if (!lot.delete(id)) {
        return HttpResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Vehicle not found' } },
          { status: 404 },
        );
      }
      deleted.push(id);
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return { lot, deleted };
}

const rowFor = (name: string) => screen.findByRole('row', { name: new RegExp(name) });

describe('AdminPage', () => {
  it('summarises the inventory in stat tiles', async () => {
    serveLot([camry, mustang]);
    logInAs('ADMIN');
    renderAppAt('/admin');

    const stats = await screen.findByRole('list', { name: /inventory summary/i });
    expect(within(stats).getByText('Listings').nextSibling).toHaveTextContent('2');
    expect(within(stats).getByText('Units in stock').nextSibling).toHaveTextContent('4');
    expect(within(stats).getByText('Sold out').nextSibling).toHaveTextContent('1');
    // 4 × $30,995 at list price
    expect(within(stats).getByText('Stock value').nextSibling).toHaveTextContent('$123,980');
  });

  it('lists every vehicle with its category, price and stock', async () => {
    serveLot([camry, mustang]);
    logInAs('ADMIN');
    renderAppAt('/admin');

    const camryRow = await rowFor('2023 Toyota Camry XSE');
    expect(within(camryRow).getByText('Sedan')).toBeInTheDocument();
    expect(within(camryRow).getByText('$30,995')).toBeInTheDocument();
    expect(within(camryRow).getByText('4 in stock')).toBeInTheDocument();
    const mustangRow = await rowFor('2018 Ford Mustang Convertible');
    expect(within(mustangRow).getByText('Sold out')).toBeInTheDocument();
  });

  it('asks for confirmation before deleting, and Cancel changes nothing', async () => {
    const { deleted } = serveLot([camry, mustang]);
    logInAs('ADMIN');
    const { user } = renderAppAt('/admin');

    await user.click(
      within(await rowFor('2023 Toyota Camry XSE')).getByRole('button', { name: /delete/i }),
    );

    const dialog = screen.getByRole('dialog', { name: 'Delete 2023 Toyota Camry XSE?' });
    expect(dialog).toHaveTextContent("This can't be undone.");
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(deleted).toEqual([]);
    expect(screen.getByRole('row', { name: /2023 Toyota Camry XSE/ })).toBeInTheDocument();
  });

  it('deletes after confirmation, removes the row and confirms with a toast', async () => {
    const { deleted } = serveLot([camry, mustang]);
    logInAs('ADMIN');
    const { user } = renderAppAt('/admin');

    await user.click(
      within(await rowFor('2023 Toyota Camry XSE')).getByRole('button', { name: /delete/i }),
    );
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete vehicle' }),
    );

    await waitFor(() =>
      expect(screen.queryByRole('row', { name: /2023 Toyota Camry XSE/ })).not.toBeInTheDocument(),
    );
    expect(deleted).toEqual(['veh-camry']);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Deleted 2023 Toyota Camry XSE')).toBeInTheDocument();
  });

  it('reports a failed delete and keeps the dialog open', async () => {
    const { lot } = serveLot([camry, mustang]);
    logInAs('ADMIN');
    const { user } = renderAppAt('/admin');

    await user.click(
      within(await rowFor('2023 Toyota Camry XSE')).getByRole('button', { name: /delete/i }),
    );
    lot.delete('veh-camry'); // someone else deleted it meanwhile
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete vehicle' }),
    );

    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent(
      'Vehicle not found',
    );
  });
});
