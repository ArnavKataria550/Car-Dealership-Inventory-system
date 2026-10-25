import { describe, expect, it } from 'vitest';

import { SEED_VEHICLES } from '../../../src/seed/seed-vehicles.js';
import { createVehicleSchema } from '../../../src/modules/vehicles/vehicle.schemas.js';
import { CATEGORIES } from '../../../src/modules/vehicles/vehicle.types.js';

/** Licenses that allow reuse in this project (with attribution where required). */
const ALLOWED_LICENSES = ['CC0', 'Public domain', 'CC BY 4.0', 'CC BY-SA 4.0'];

describe('seed vehicle catalogue', () => {
  it('has 14 vehicles, exactly two in each category', () => {
    expect(SEED_VEHICLES).toHaveLength(14);
    for (const category of CATEGORIES) {
      expect(SEED_VEHICLES.filter((v) => v.category === category)).toHaveLength(2);
    }
  });

  it.each(SEED_VEHICLES.map((v) => [`${v.year} ${v.make} ${v.model}`, v] as const))(
    '%s passes the same validation as POST /api/vehicles',
    (_name, { imageCredit: _credit, ...vehicle }) => {
      const result = createVehicleSchema.safeParse(vehicle);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(vehicle);
    },
  );

  it('includes some out-of-stock vehicles so the disabled Purchase button can be seen', () => {
    expect(SEED_VEHICLES.some((v) => v.quantity === 0)).toBe(true);
    expect(SEED_VEHICLES.some((v) => v.quantity > 0)).toBe(true);
  });

  it('uses a distinct 1280px Wikimedia Commons image for every vehicle', () => {
    const urls = SEED_VEHICLES.map((v) => v.imageUrl);

    expect(new Set(urls).size).toBe(urls.length);
    for (const url of urls) {
      expect(url).toMatch(
        /^https:\/\/(thumb|upload)\.wikimedia\.org\/wikipedia\/commons\/thumb\/.+\/1280px-[^?]+$/,
      );
    }
  });

  it('credits every photo with its author, an allowed license and the Commons source page', () => {
    for (const { imageCredit } of SEED_VEHICLES) {
      expect(imageCredit.author.trim()).not.toBe('');
      expect(ALLOWED_LICENSES).toContain(imageCredit.license);
      expect(imageCredit.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    }
  });
});
