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

/** A category in any letter case ("suv", "Suv"), normalised to the stored upper-case value. */
const categorySchema = z
  .string({ error: 'Category is required' })
  .trim()
  .toUpperCase()
  .pipe(z.enum(CATEGORIES, { error: `Category must be one of: ${CATEGORIES.join(', ')}` }));

/** Rules for each editable field, shared by create (all required) and update (all optional). */
const vehicleFields = {
  make: requiredText('Make', 50),
  model: requiredText('Model', 50),
  category: categorySchema,
  year: wholeNumber('Year')
    .min(FIRST_CAR_YEAR, `Year must be ${FIRST_CAR_YEAR} or later`)
    // Evaluated on every request, so the limit moves forward each January.
    .refine((year) => year <= new Date().getFullYear() + 1, 'Year cannot be later than next year'),
  color: requiredText('Color', 30),
  priceCents: wholeNumber('Price').min(0, 'Price cannot be negative'),
  quantity: wholeNumber('Quantity').min(0, 'Quantity cannot be negative'),
  imageUrl: z
    .string({ error: 'Image URL is required' })
    .trim()
    .max(2048, 'Image URL is too long')
    .pipe(z.url({ protocol: /^https?$/, error: 'Image URL must be a valid http(s) URL' })),
};

/** Body of POST /api/vehicles. Unknown keys (e.g. a client-chosen id) are stripped. */
export const createVehicleSchema = z.object({
  ...vehicleFields,
  quantity: vehicleFields.quantity.default(0),
});

export type CreateVehicleBody = z.infer<typeof createVehicleSchema>;

/**
 * Body of PUT /api/vehicles/:id: a partial update. Any subset of fields may be
 * sent (absent ones keep their current value), but at least one is required.
 */
export const updateVehicleSchema = z
  .object(vehicleFields)
  .partial()
  .refine((changes) => Object.keys(changes).length > 0, {
    message: 'Provide at least one field to update',
  });

export type UpdateVehicleBody = z.infer<typeof updateVehicleSchema>;

/** Body of POST /api/vehicles/:id/purchase. Sending no body buys a single unit. */
export const purchaseSchema = z.object({
  quantity: wholeNumber('Quantity').min(1, 'Quantity must be at least 1').default(1),
});

export type PurchaseBody = z.infer<typeof purchaseSchema>;

/** Treats a missing, empty or whitespace-only query value as "no filter". */
function blankToUndefined(value: unknown): unknown {
  return typeof value === 'string' && value.trim() === '' ? undefined : value;
}

function optionalSearchText() {
  return z.preprocess(blankToUndefined, z.string().trim().max(50).optional());
}

function optionalPriceBound(label: string) {
  return z.preprocess(
    blankToUndefined,
    z.coerce
      .number({ error: `${label} must be a number` })
      .int(`${label} must be a whole number of cents`)
      .min(0, `${label} cannot be negative`)
      .max(MAX_INT32, `${label} is too large`)
      .optional(),
  );
}

/** Query string of GET /api/vehicles/search. Every filter is optional. */
export const searchVehiclesSchema = z
  .object({
    make: optionalSearchText(),
    model: optionalSearchText(),
    category: z.preprocess(blankToUndefined, categorySchema.optional()),
    minPriceCents: optionalPriceBound('Minimum price'),
    maxPriceCents: optionalPriceBound('Maximum price'),
  })
  .refine(
    ({ minPriceCents, maxPriceCents }) =>
      minPriceCents === undefined || maxPriceCents === undefined || minPriceCents <= maxPriceCents,
    { path: ['minPriceCents'], message: 'Minimum price cannot be greater than maximum price' },
  );

export type SearchVehiclesQuery = z.infer<typeof searchVehiclesSchema>;
