import { useState, type FormEvent } from 'react';

import { ApiError } from '../../api/client';
import { CATEGORIES, CATEGORY_LABELS, type VehicleInput } from '../../api/vehicles';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { SelectField } from '../../components/ui/SelectField';
import { TextField } from '../../components/ui/TextField';
import {
  formFieldFor,
  isHttpUrl,
  toFormValues,
  validateVehicleForm,
  type VehicleFormErrors,
  type VehicleFormField,
  type VehicleFormValues,
} from './vehicle-form-validation';

export interface VehicleFormProps {
  /** Pre-fills the form when editing an existing vehicle. */
  initial?: VehicleInput;
  submitLabel: string;
  /** Receives clean, validated input. Reject with an ApiError to show server errors. */
  onSubmit: (input: VehicleInput) => Promise<void>;
}

const CATEGORY_OPTIONS = CATEGORIES.map((value) => ({ value, label: CATEGORY_LABELS[value] }));

/** Add/edit form for a listing, with the same rules as the API and a live photo preview. */
export function VehicleForm({ initial, submitLabel, onSubmit }: VehicleFormProps) {
  const [values, setValues] = useState<VehicleFormValues>(() => toFormValues(initial));
  const [errors, setErrors] = useState<VehicleFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const field = (name: VehicleFormField) => ({
    name,
    value: values[name],
    error: errors[name],
    onChange: (event: { target: { value: string } }) =>
      setValues((current) => ({ ...current, [name]: event.target.value })),
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const result = validateVehicleForm(values);
    setErrors(result.errors);
    if (!result.input) return;

    setSaving(true);
    try {
      await onSubmit(result.input);
    } catch (error) {
      showServerError(error);
    } finally {
      setSaving(false);
    }
  }

  function showServerError(error: unknown) {
    if (!(error instanceof ApiError)) {
      setFormError('Something went wrong.');
      return;
    }
    const byField: VehicleFormErrors = {};
    for (const detail of error.details) {
      const name = formFieldFor(detail.field);
      if (name) byField[name] = detail.message;
    }
    if (Object.keys(byField).length > 0) setErrors(byField);
    else setFormError(error.message);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {formError && <Alert>{formError}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Make" placeholder="Toyota" {...field('make')} />
        <TextField label="Model" placeholder="Camry XSE" {...field('model')} />
        <SelectField
          label="Category"
          placeholder="Select…"
          options={CATEGORY_OPTIONS}
          {...field('category')}
        />
        <TextField label="Year" inputMode="numeric" placeholder="2024" {...field('year')} />
        <TextField label="Color" placeholder="Celestial Silver" {...field('color')} />
        <TextField
          label="Price (USD)"
          inputMode="decimal"
          placeholder="27,999"
          {...field('price')}
        />
        <TextField label="Quantity" inputMode="numeric" {...field('quantity')} />
      </div>

      <TextField
        label="Image URL"
        type="url"
        placeholder="https://…"
        hint="A photo of this exact make, model and year."
        {...field('imageUrl')}
      />
      <PhotoPreview url={values.imageUrl.trim()} />

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={saving} loadingText="Saving…">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function PhotoPreview({ url }: { url: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (!isHttpUrl(url)) return null;

  return (
    <div className="overflow-hidden rounded-xl bg-stone-100 ring-1 ring-ink-950/5">
      {failedUrl === url ? (
        <p className="px-4 py-8 text-center text-sm text-stone-500">
          Couldn't load an image from this URL.
        </p>
      ) : (
        <img
          src={url}
          alt="Photo preview"
          onError={() => setFailedUrl(url)}
          className="aspect-[16/10] w-full object-cover"
        />
      )}
    </div>
  );
}
