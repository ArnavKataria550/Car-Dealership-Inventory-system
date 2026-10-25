import { z } from 'zod';

import { CATEGORIES } from './vehicle.types.js';

/** Largest value a Postgres INTEGER column can hold; beyond it inserts would fail with a 500. */
const MAX_INT32 = 2_147_483_647;
/** The first petrol car (Benz Patent-Motorwagen) dates from 1886. */
const FIRST_CAR_YEAR = 1886;

function requiredText(label: string, maxLength: number) {
  return z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(maxLength, `${label} must be at most ${maxLength} characters`);
}

function wholeNumber(label: string) {
  return z
    .number({ error: `${label} must be a number` })
    .int(`${label} must be a whole number`)
    .max(MAX_INT32, `${label} is too large`);
}

/** Body of POST /api/vehicles. Unknown keys (e.g. a client-chosen id) are stripped. */
export const createVehicleSchema = z.object({
  make: requiredText('Make', 50),
  model: requiredText('Model', 50),
  category: z
    .string({ error: 'Category is required' })
    .trim()
    .toUpperCase()
    .pipe(z.enum(CATEGORIES, { error: `Category must be one of: ${CATEGORIES.join(', ')}` })),
  year: wholeNumber('Year')
    .min(FIRST_CAR_YEAR, `Year must be ${FIRST_CAR_YEAR} or later`)
    // Evaluated on every request, so the limit moves forward each January.
    .refine((year) => year <= new Date().getFullYear() + 1, 'Year cannot be later than next year'),
  color: requiredText('Color', 30),
  priceCents: wholeNumber('Price').min(0, 'Price cannot be negative'),
  quantity: wholeNumber('Quantity').min(0, 'Quantity cannot be negative').default(0),
  imageUrl: z
    .string({ error: 'Image URL is required' })
    .trim()
    .max(2048, 'Image URL is too long')
    .pipe(z.url({ protocol: /^https?$/, error: 'Image URL must be a valid http(s) URL' })),
});

export type CreateVehicleBody = z.infer<typeof createVehicleSchema>;
