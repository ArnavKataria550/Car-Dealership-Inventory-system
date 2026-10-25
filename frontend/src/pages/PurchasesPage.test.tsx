import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import type { Purchase } from '../api/purchases';
import { buildPurchase } from '../test/fixtures';
import { server } from '../test/msw-server';
import { logInAs, renderAppAt } from '../test/render-app';

const camryOrder = buildPurchase({
  id: 'pur-camry',
  purchasedAt: '2026-10-25T12:00:00.000Z',
});
const mustangOrder = buildPurchase({
  id: 'pur-mustang',
  vehicleId: null, // listing deleted since
  quantity: 2,
  unitPriceCents: 3_290_000,
  totalCents: 6_580_000,
  purchasedAt: '2026-10-20T12:00:00.000Z',
  vehicle: {
    make: 'Ford',
    model: 'Mustang Convertible',
    category: 'CONVERTIBLE',
    year: 2018,
    color: 'Yellow',
    imageUrl: 'https://images.example.test/mustang.jpg',
  },
  buyer: { id: 'user-2', name: 'Jordan Lee', email: 'jordan@example.com' },
});

function servePurchases(purchases: Purchase[]) {
  server.use(
    http.get('/api/purchases', () => HttpResponse.json({ purchases })),
    http.get('/api/vehicles', () => HttpResponse.json({ vehicles: [] })),
  );
}

describe('PurchasesPage', () => {
  it('is linked from the navbar', async () => {
    servePurchases([]);
    logInAs('USER');
    const { user, router } = renderAppAt('/');

    await user.click(screen.getByRole('link', { name: 'Purchases' }));

    expect(router.state.location.pathname).toBe('/purchases');
  });

  it("lists a customer's purchases with what, when, how many and the total", async () => {
    servePurchases([camryOrder, mustangOrder]);
    logInAs('USER');
    renderAppAt('/purchases');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'My purchases' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('2 purchases · $96,795 spent')).toBeInTheDocument();

    const [first, second] = screen.getAllByRole('article');
    expect(first).toHaveAccessibleName('2023 Toyota Camry XSE');
    expect(within(first!).getByText('Oct 25, 2026')).toBeInTheDocument();
    expect(within(first!).getByText('1 × $30,995')).toBeInTheDocument();
    expect(within(second!).getByText('2 × $32,900')).toBeInTheDocument();
    expect(within(second!).getByText('$65,800')).toBeInTheDocument();
  });

  it('links to the car while it is still listed, and says when it is not', async () => {
    servePurchases([camryOrder, mustangOrder]);
    logInAs('USER');
    renderAppAt('/purchases');

    const [first, second] = await screen.findAllByRole('article');
    expect(within(first!).getByRole('link', { name: '2023 Toyota Camry XSE' })).toHaveAttribute(
      'href',
      '/vehicles/veh-camry',
    );
    expect(within(second!).queryByRole('link')).not.toBeInTheDocument();
    expect(within(second!).getByText('No longer listed')).toBeInTheDocument();
  });

  it('does not show buyer names to customers', async () => {
    servePurchases([camryOrder]);
    logInAs('USER');
    renderAppAt('/purchases');

    await screen.findAllByRole('article');
    expect(screen.queryByText(/bought by/i)).not.toBeInTheDocument();
  });

  it('shows admins every sale with the buyer', async () => {
    servePurchases([camryOrder, mustangOrder]);
    logInAs('ADMIN');
    renderAppAt('/purchases');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'All purchases' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('2 purchases · $96,795 in sales')).toBeInTheDocument();
    expect(screen.getByText('Bought by Arnav Kataria')).toBeInTheDocument();
    expect(screen.getByText('Bought by Jordan Lee')).toBeInTheDocument();
  });

  it('invites a new customer to browse when there are no purchases', async () => {
    servePurchases([]);
    logInAs('USER');
    renderAppAt('/purchases');

    expect(await screen.findByRole('heading', { name: 'No purchases yet' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse the inventory' })).toHaveAttribute('href', '/');
  });

  it('shows a load error with Retry', async () => {
    let attempts = 0;
    server.use(
      http.get('/api/purchases', () => {
        attempts += 1;
        return attempts === 1
          ? HttpResponse.json(
              { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
              { status: 500 },
            )
          : HttpResponse.json({ purchases: [camryOrder] });
      }),
    );
    logInAs('USER');
    const { user } = renderAppAt('/purchases');

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't load your purchases/i);
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(
      await screen.findByRole('article', { name: '2023 Toyota Camry XSE' }),
    ).toBeInTheDocument();
  });
});
