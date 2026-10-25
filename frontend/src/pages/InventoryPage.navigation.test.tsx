import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { buildVehicle } from '../test/fixtures';
import { server } from '../test/msw-server';
import { logInAs, renderAppAt } from '../test/render-app';

describe('inventory cards open the details page', () => {
  it('clicking a card navigates to /vehicles/:id', async () => {
    const camry = buildVehicle();
    server.use(
      http.get('/api/vehicles', () => HttpResponse.json({ vehicles: [camry] })),
      http.get('/api/vehicles/veh-camry', () => HttpResponse.json({ vehicle: camry })),
    );
    logInAs('USER');
    const { user, router } = renderAppAt('/');

    const card = await screen.findByRole('article', { name: '2023 Toyota Camry XSE' });
    expect(within(card).queryByRole('button', { name: /purchase/i })).not.toBeInTheDocument();
    await user.click(within(card).getByRole('link', { name: '2023 Toyota Camry XSE' }));

    expect(router.state.location.pathname).toBe('/vehicles/veh-camry');
  });
});
