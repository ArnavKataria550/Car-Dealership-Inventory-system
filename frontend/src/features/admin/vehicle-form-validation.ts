import { CATEGORIES, type Category, type VehicleInput } from '../../api/vehicles';
import { centsToDollarInput, parseDollars } from '../../lib/money';

/** The form's fields, exactly as typed. */
export interface VehicleFormValues {
  make: string;
  model: string;
  category: Category | '';
  year: string;
  color: string;
  price: string;
  quantity: string;
  imageUrl: string;
}

export type VehicleFormField = keyof VehicleFormValues;
export type VehicleFormErrors = Partial<Record<VehicleFormField, string>>;

// Limits mirror the API so the form never submits something the server would reject.
const FIRST_CAR_YEAR = 1886;
const MAX_INT32 = 2_147_483_647;
const WHOLE_NUMBER = /^\d+$/;

export function toFormValues(vehicle?: VehicleInput): VehicleFormValues {
  return {
    make: vehicle?.make ?? '',
    model: vehicle?.model ?? '',
    category: vehicle?.category ?? '',
    year: vehicle ? String(vehicle.year) : '',
    color: vehicle?.color ?? '',
    price: vehicle ? centsToDollarInput(vehicle.priceCents) : '',
    quantity: vehicle ? String(vehicle.quantity) : '0',
    imageUrl: vehicle?.imageUrl ?? '',
  };
}

export function isHttpUrl(text: string): boolean {
  try {
    const { protocol } = new URL(text.trim());
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

/** Validates the form; returns either field errors or a clean VehicleInput for the API. */
export function validateVehicleForm(
  values: VehicleFormValues,
):
  | { errors: VehicleFormErrors; input?: undefined }
  | { errors: VehicleFormErrors; input: VehicleInput } {
  const errors: VehicleFormErrors = {};
  const latestYear = new Date().getFullYear() + 1;

  const text = (field: 'make' | 'model' | 'color', label: string, max: number) => {
    const value = values[field].trim();
    if (value === '') errors[field] = `${label} is required`;
    else if (value.length > max) errors[field] = `${label} must be at most ${max} characters`;
    return value;
  };
  const make = text('make', 'Make', 50);
  const model = text('model', 'Model', 50);
  const color = text('color', 'Color', 30);

  if (!(CATEGORIES as readonly string[]).includes(values.category)) {
    errors.category = 'Choose a category';
  }

  const yearText = values.year.trim();
  const year = Number(yearText);
  if (yearText === '') errors.year = 'Year is required';
  else if (!WHOLE_NUMBER.test(yearText) || year < FIRST_CAR_YEAR || year > latestYear) {
    errors.year = `Year must be between ${FIRST_CAR_YEAR} and ${latestYear}`;
  }

  const priceCents = parseDollars(values.price);
  if (values.price.trim() === '') errors.price = 'Price is required';
  else if (priceCents === null) errors.price = 'Enter a valid price, e.g. 27,999.50';
  else if (priceCents > MAX_INT32) errors.price = 'Price is too large';

  const quantityText = values.quantity.trim();
  const quantity = Number(quantityText);
  if (quantityText === '') errors.quantity = 'Quantity is required';
  else if (!WHOLE_NUMBER.test(quantityText)) {
    errors.quantity = 'Quantity must be a whole number, 0 or more';
  } else if (quantity > MAX_INT32) errors.quantity = 'Quantity is too large';

  const imageUrl = values.imageUrl.trim();
  if (imageUrl === '') errors.imageUrl = 'Image URL is required';
  else if (!isHttpUrl(imageUrl)) errors.imageUrl = 'Enter an http(s) image URL';

  if (Object.keys(errors).length > 0) return { errors };
  return {
    errors,
    input: {
      make,
      model,
      category: values.category as Category,
      year,
      color,
      priceCents: priceCents!,
      quantity,
      imageUrl,
    },
  };
}

/** Maps an API field name (e.g. priceCents) to the form field that shows its error. */
export function formFieldFor(apiField: string): VehicleFormField | undefined {
  const mapped = apiField === 'priceCents' ? 'price' : apiField;
  return mapped in toFormValues() ? (mapped as VehicleFormField) : undefined;
}
