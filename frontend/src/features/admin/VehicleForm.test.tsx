import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../api/client';
import { VehicleForm, type VehicleFormProps } from './VehicleForm';

const nextYear = new Date().getFullYear() + 1;

function renderForm(props: Partial<VehicleFormProps> = {}) {
  const onSubmit = vi.fn<VehicleFormProps['onSubmit']>().mockResolvedValue(undefined);
  render(<VehicleForm submitLabel="Add vehicle" onSubmit={onSubmit} {...props} />);
  return { onSubmit, user: userEvent.setup() };
}

const field = (label: string) => screen.getByLabelText(label);

async function fillValidVehicle(user: ReturnType<typeof userEvent.setup>) {
  await user.type(field('Make'), '  Toyota ');
  await user.type(field('Model'), 'Corolla Cross');
  await user.selectOptions(field('Category'), 'SUV');
  await user.type(field('Year'), '2024');
  await user.type(field('Color'), 'Blueprint');
  await user.type(field('Price (USD)'), '28,450.50');
  await user.clear(field('Quantity'));
  await user.type(field('Quantity'), '5');
  await user.type(field('Image URL'), 'https://images.example.test/corolla-cross.jpg');
}

describe('VehicleForm', () => {
  it('has a labelled field for every vehicle property', () => {
    renderForm();

    for (const label of [
      'Make',
      'Model',
      'Category',
      'Year',
      'Color',
      'Price (USD)',
      'Quantity',
      'Image URL',
    ]) {
      expect(field(label)).toBeInTheDocument();
    }
    expect(field('Quantity')).toHaveValue('0');
  });

  it('lists every missing field and does not submit', async () => {
    const { onSubmit, user } = renderForm();
    await user.clear(field('Quantity'));

    await user.click(screen.getByRole('button', { name: 'Add vehicle' }));

    expect(field('Make')).toHaveAccessibleDescription('Make is required');
    expect(field('Model')).toHaveAccessibleDescription('Model is required');
    expect(field('Category')).toHaveAccessibleDescription('Choose a category');
    expect(field('Year')).toHaveAccessibleDescription('Year is required');
    expect(field('Color')).toHaveAccessibleDescription('Color is required');
    expect(field('Price (USD)')).toHaveAccessibleDescription('Price is required');
    expect(field('Quantity')).toHaveAccessibleDescription('Quantity is required');
    expect(field('Image URL')).toHaveAccessibleDescription('Image URL is required');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it.each([
    ['Year', '1885', `Year must be between 1886 and ${nextYear}`],
    ['Year', String(nextYear + 1), `Year must be between 1886 and ${nextYear}`],
    ['Price (USD)', 'twenty grand', 'Enter a valid price, e.g. 27,999.50'],
    ['Quantity', '1.5', 'Quantity must be a whole number, 0 or more'],
    ['Image URL', 'ftp://images.example.test/car.jpg', 'Enter an http(s) image URL'],
    ['Make', 'x'.repeat(51), 'Make must be at most 50 characters'],
  ])('rejects an invalid %s (%s)', async (label, value, message) => {
    const { onSubmit, user } = renderForm();
    await fillValidVehicle(user);
    await user.clear(field(label));
    await user.type(field(label), value);

    await user.click(screen.getByRole('button', { name: 'Add vehicle' }));

    expect(field(label)).toHaveAccessibleDescription(message);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits clean values, with the price converted to cents', async () => {
    const { onSubmit, user } = renderForm();
    await fillValidVehicle(user);

    await user.click(screen.getByRole('button', { name: 'Add vehicle' }));

    expect(onSubmit).toHaveBeenCalledWith({
      make: 'Toyota',
      model: 'Corolla Cross',
      category: 'SUV',
      year: 2024,
      color: 'Blueprint',
      priceCents: 2_845_050,
      quantity: 5,
      imageUrl: 'https://images.example.test/corolla-cross.jpg',
    });
  });

  it('previews the photo once a valid image URL is entered', async () => {
    const { user } = renderForm();
    expect(screen.queryByRole('img', { name: /preview/i })).not.toBeInTheDocument();

    await user.type(field('Image URL'), 'https://images.example.test/corolla-cross.jpg');

    expect(screen.getByRole('img', { name: /preview/i })).toHaveAttribute(
      'src',
      'https://images.example.test/corolla-cross.jpg',
    );
  });

  it('starts from an existing vehicle when editing', () => {
    renderForm({
      initial: {
        make: 'Toyota',
        model: 'Camry XSE',
        category: 'SEDAN',
        year: 2023,
        color: 'Celestial Silver',
        priceCents: 3_099_550,
        quantity: 4,
        imageUrl: 'https://images.example.test/camry.jpg',
      },
    });

    expect(field('Make')).toHaveValue('Toyota');
    expect(field('Category')).toHaveValue('SEDAN');
    expect(field('Year')).toHaveValue('2023');
    expect(field('Price (USD)')).toHaveValue('30995.50');
    expect(field('Quantity')).toHaveValue('4');
  });

  it('shows server field errors next to their fields', async () => {
    const { onSubmit, user } = renderForm();
    onSubmit.mockRejectedValue(
      new ApiError(400, 'VALIDATION_ERROR', 'Request body is invalid', [
        { field: 'priceCents', message: 'Price is too large' },
        { field: 'imageUrl', message: 'Image URL is too long' },
      ]),
    );
    await fillValidVehicle(user);

    await user.click(screen.getByRole('button', { name: 'Add vehicle' }));

    await waitFor(() =>
      expect(field('Price (USD)')).toHaveAccessibleDescription('Price is too large'),
    );
    expect(field('Image URL')).toHaveAccessibleDescription('Image URL is too long');
  });

  it('shows other failures in an alert', async () => {
    const { onSubmit, user } = renderForm();
    onSubmit.mockRejectedValue(new ApiError(403, 'FORBIDDEN', 'You do not have permission'));
    await fillValidVehicle(user);

    await user.click(screen.getByRole('button', { name: 'Add vehicle' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('You do not have permission');
  });

  it('disables the submit button while saving', async () => {
    let finish!: () => void;
    const { onSubmit, user } = renderForm();
    onSubmit.mockImplementation(() => new Promise<void>((resolve) => (finish = resolve)));
    await fillValidVehicle(user);

    await user.click(screen.getByRole('button', { name: 'Add vehicle' }));

    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    finish();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add vehicle' })).toBeEnabled());
  });
});
