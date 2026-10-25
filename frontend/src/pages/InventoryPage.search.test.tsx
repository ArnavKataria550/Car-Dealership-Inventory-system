import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import type { Vehicle } from '../api/vehicles';
import { buildVehicle } from '../test/fixtures';
import { server } from '../test/msw-server';
import { logInAs, renderAppAt } from '../test/render-app';

const lot: Vehicle[] = [
  buildVehicle({
    id: 'v1',
    make: 'Toyota',
    model: 'Camry XSE',
    category: 'SEDAN',
    priceCents: 3_099_500,
  }),
  buildVehicle({
    id: 'v2',
    make: 'Toyota',
    model: 'RAV4 Prime XSE',
    category: 'SUV',
    priceCents: 4_369_000,
  }),
  buildVehicle({
    id: 'v3',
    make: 'Hyundai',
    model: 'Tucson SEL',
    category: 'SUV',
    priceCents: 2_750_000,
  }),
  buildVehicle({
    id: 'v4',
    make: 'Tesla',
    model: 'Model 3',
    category: 'EV',
    priceCents: 4_024_000,
  }),
];

/** Fake API that filters like the real one and records every search query it receives. */
function serveLot() {
  const searches: URLSearchParams[] = [];
  server.use(
    http.get('/api/vehicles', () => HttpResponse.json({ vehicles: lot })),
    http.get('/api/vehicles/search', ({ request }) => {
      const query = new URL(request.url).searchParams;
      searches.push(query);
      const contains = (value: string, key: string) =>
        !query.get(key) || value.toLowerCase().includes(query.get(key)!.toLowerCase());
      const min = Number(query.get('minPriceCents') ?? 0);
      const max = Number(query.get('maxPriceCents') ?? Infinity);
      const vehicles = lot.filter(
        (v) =>
          contains(v.make, 'make') &&
          contains(v.model, 'model') &&
          (!query.get('category') || v.category === query.get('category')) &&
          v.priceCents >= min &&
          v.priceCents <= max,
      );
      return HttpResponse.json({ vehicles });
    }),
  );
  return searches;
}

async function shownModels() {
  const cards = await screen.findAllByRole('article');
  return cards.map((card) => within(card).getByRole('heading').textContent);
}

async function expectModels(expected: string[]) {
  await waitFor(async () => expect(await shownModels()).toEqual(expected));
}

describe('inventory search and filters', () => {
  it('filters by make as the user types, sending one request after typing stops', async () => {
    const searches = serveLot();
    logInAs('USER');
    const { user, router } = renderAppAt('/');
    await screen.findAllByRole('article');

    await user.type(screen.getByLabelText('Make'), 'toyota');

    await expectModels(['2023 Toyota Camry XSE', '2023 Toyota RAV4 Prime XSE']);
    expect(searches).toHaveLength(1);
    expect(searches[0]?.get('make')).toBe('toyota');
    expect(router.state.location.search).toBe('?make=toyota');
  });

  it('filters by model', async () => {
    serveLot();
    logInAs('USER');
    const { user } = renderAppAt('/');
    await screen.findAllByRole('article');

    await user.type(screen.getByLabelText('Model'), 'model');

    await expectModels(['2023 Tesla Model 3']);
  });

  it('filters by category with toggle chips, and "All" resets', async () => {
    serveLot();
    logInAs('USER');
    const { user } = renderAppAt('/');
    await screen.findAllByRole('article');

    const suv = screen.getByRole('button', { name: 'SUV' });
    await user.click(suv);

    expect(suv).toHaveAttribute('aria-pressed', 'true');
    await expectModels(['2023 Toyota RAV4 Prime XSE', '2023 Hyundai Tucson SEL']);

    await user.click(screen.getByRole('button', { name: 'All' }));
    await expectModels([
      '2023 Toyota Camry XSE',
      '2023 Toyota RAV4 Prime XSE',
      '2023 Hyundai Tucson SEL',
      '2023 Tesla Model 3',
    ]);
  });

  it('filters by a price range entered in dollars', async () => {
    const searches = serveLot();
    logInAs('USER');
    const { user } = renderAppAt('/');
    await screen.findAllByRole('article');

    await user.type(screen.getByLabelText('Min price'), '30,000');
    await user.type(screen.getByLabelText('Max price'), '41000');

    await expectModels(['2023 Toyota Camry XSE', '2023 Tesla Model 3']);
    const last = searches.at(-1)!;
    expect(last.get('minPriceCents')).toBe('3000000');
    expect(last.get('maxPriceCents')).toBe('4100000');
  });

  it('flags an invalid price and leaves it out of the search', async () => {
    const searches = serveLot();
    logInAs('USER');
    const { user } = renderAppAt('/');
    await screen.findAllByRole('article');

    await user.type(screen.getByLabelText('Min price'), 'cheap');

    expect(await screen.findByText('Enter a valid amount')).toBeInTheDocument();
    expect(searches.every((query) => !query.has('minPriceCents'))).toBe(true);
  });

  it('flags a minimum above the maximum', async () => {
    serveLot();
    logInAs('USER');
    const { user } = renderAppAt('/');
    await screen.findAllByRole('article');

    await user.type(screen.getByLabelText('Min price'), '50000');
    await user.type(screen.getByLabelText('Max price'), '20000');

    expect(await screen.findByText("Min can't be more than max")).toBeInTheDocument();
  });

  it('restores filters from the URL', async () => {
    serveLot();
    logInAs('USER');
    renderAppAt('/?category=EV&make=tes');

    await expectModels(['2023 Tesla Model 3']);
    expect(screen.getByLabelText('Make')).toHaveValue('tes');
    expect(screen.getByRole('button', { name: 'EV' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('says when nothing matches and lets the user clear every filter', async () => {
    serveLot();
    logInAs('USER');
    const { user, router } = renderAppAt('/?make=lamborghini&category=SUV');

    expect(await screen.findByRole('heading', { name: /no cars match/i })).toBeInTheDocument();
    const [clear] = screen.getAllByRole('button', { name: /clear filters/i });
    await user.click(clear!);

    await expectModels([
      '2023 Toyota Camry XSE',
      '2023 Toyota RAV4 Prime XSE',
      '2023 Hyundai Tucson SEL',
      '2023 Tesla Model 3',
    ]);
    expect(screen.getByLabelText('Make')).toHaveValue('');
    expect(router.state.location.search).toBe('');
  });

  it('only offers "Clear filters" while a filter is active', async () => {
    serveLot();
    logInAs('USER');
    const { user } = renderAppAt('/');
    await screen.findAllByRole('article');

    expect(screen.queryByRole('button', { name: /clear filters/i })).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Make'), 'a');
    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
  });
});
