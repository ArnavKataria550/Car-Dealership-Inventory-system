import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import type { Vehicle } from '../api/vehicles';
import { buildVehicle } from '../test/fixtures';
import { server } from '../test/msw-server';
import { logInAs, renderAppAt } from '../test/render-app';

/** In-memory stand-in for one listing; purchases really lower its stock. */
function serveVehicle(initial: Vehicle) {
  const state = { vehicle: { ...initial } as Vehicle | null, purchases: 0 };
  server.use(
    http.get('/api/vehicles/:id', () =>
      state.vehicle
        ? HttpResponse.json({ vehicle: state.vehicle })
        : HttpResponse.json(
            { error: { code: 'NOT_FOUND', message: 'Vehicle not found' } },
            { status: 404 },
          ),
    ),
    http.post('/api/vehicles/:id/purchase', () => {
      state.purchases += 1;
      if (!state.vehicle || state.vehicle.quantity === 0) {
        return HttpResponse.json(
          { error: { code: 'INSUFFICIENT_STOCK', message: 'This vehicle is out of stock' } },
          { status: 409 },
        );
      }
      state.vehicle = { ...state.vehicle, quantity: state.vehicle.quantity - 1 };
      return HttpResponse.json({ vehicle: state.vehicle });
    }),
  );
  return state;
}

const camry = buildVehicle({ quantity: 4, year: 2023, color: 'Celestial Silver' });
const purchaseButton = () => screen.getByRole('button', { name: /purchase|sold out/i });

describe('VehicleDetailsPage', () => {
  it('shows the full details of the vehicle with a way back to the inventory', async () => {
    serveVehicle(camry);
    logInAs('USER');
    renderAppAt('/vehicles/veh-camry');

    expect(
      await screen.findByRole('heading', { level: 1, name: '2023 Toyota Camry XSE' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '2023 Toyota Camry XSE' })).toBeInTheDocument();
    const facts = screen.getByRole('list', { name: /specifications/i });
    expect(within(facts).getByText('Sedan')).toBeInTheDocument();
    expect(within(facts).getByText('Celestial Silver')).toBeInTheDocument();
    expect(within(facts).getByText('2023')).toBeInTheDocument();
    expect(screen.getByText('$30,995')).toBeInTheDocument();
    expect(screen.getByText('4 in stock')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to inventory/i })).toHaveAttribute('href', '/');
  });

  it('shows a loading message first', async () => {
    serveVehicle(camry);
    logInAs('USER');
    renderAppAt('/vehicles/veh-camry');

    expect(screen.getByText('Loading vehicle…')).toBeInTheDocument();
    await screen.findByRole('heading', { level: 1 });
  });

  it('asks for confirmation before buying, and Cancel buys nothing', async () => {
    const state = serveVehicle(camry);
    logInAs('USER');
    const { user } = renderAppAt('/vehicles/veh-camry');

    await user.click(await screen.findByRole('button', { name: 'Purchase' }));

    const dialog = screen.getByRole('dialog', { name: 'Confirm purchase' });
    expect(dialog).toHaveTextContent("You're about to buy one 2023 Toyota Camry XSE for $30,995.");
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(state.purchases).toBe(0);
  });

  it('buys one unit after confirming, updates the stock and confirms with a toast', async () => {
    const state = serveVehicle(camry);
    logInAs('USER');
    const { user } = renderAppAt('/vehicles/veh-camry');

    await user.click(await screen.findByRole('button', { name: 'Purchase' }));
    await user.click(screen.getByRole('button', { name: 'Confirm purchase' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(state.purchases).toBe(1);
    expect(screen.getByText('3 in stock')).toBeInTheDocument();
    expect(screen.getByText('You bought a 2023 Toyota Camry XSE')).toBeInTheDocument();
  });

  it('disables Purchase when the vehicle is sold out', async () => {
    serveVehicle({ ...camry, quantity: 0 });
    logInAs('USER');
    renderAppAt('/vehicles/veh-camry');

    await screen.findByRole('heading', { level: 1 });
    expect(purchaseButton()).toHaveTextContent('Sold out');
    expect(purchaseButton()).toBeDisabled();
  });

  it('explains when the last unit was sold meanwhile, and refreshes the stock', async () => {
    const state = serveVehicle({ ...camry, quantity: 1 });
    logInAs('USER');
    const { user } = renderAppAt('/vehicles/veh-camry');

    await user.click(await screen.findByRole('button', { name: 'Purchase' }));
    state.vehicle = { ...state.vehicle!, quantity: 0 }; // another customer buys it
    await user.click(screen.getByRole('button', { name: 'Confirm purchase' }));

    const dialog = screen.getByRole('dialog');
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'This vehicle is out of stock',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(purchaseButton()).toHaveTextContent('Sold out'));
  });

  it('shows "Vehicle not found" for an unknown id', async () => {
    const state = serveVehicle(camry);
    state.vehicle = null;
    logInAs('USER');
    renderAppAt('/vehicles/missing');

    expect(await screen.findByRole('heading', { name: 'Vehicle not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to inventory/i })).toHaveAttribute('href', '/');
  });

  it('gives admins Edit and Restock on the details page', async () => {
    serveVehicle(camry);
    logInAs('ADMIN');
    renderAppAt('/vehicles/veh-camry');

    expect(
      await screen.findByRole('button', { name: 'Edit 2023 Toyota Camry XSE' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Restock 2023 Toyota Camry XSE' }),
    ).toBeInTheDocument();
  });

  it('does not show admin actions to regular users', async () => {
    serveVehicle(camry);
    logInAs('USER');
    renderAppAt('/vehicles/veh-camry');

    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('button', { name: /^edit/i })).not.toBeInTheDocument();
  });
});
