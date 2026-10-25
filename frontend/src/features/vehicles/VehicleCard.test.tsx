import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { Vehicle } from '../../api/vehicles';
import { buildVehicle } from '../../test/fixtures';
import { VehicleCard } from './VehicleCard';

function renderCard(vehicle: Vehicle, props: Partial<Parameters<typeof VehicleCard>[0]> = {}) {
  const handlers = { onPurchase: vi.fn(), onEdit: vi.fn(), onRestock: vi.fn() };
  render(<VehicleCard vehicle={vehicle} {...handlers} {...props} />);
  return { ...handlers, user: userEvent.setup() };
}

const purchaseButton = () => screen.getByRole('button', { name: /purchase|sold out|buying/i });

describe('VehicleCard', () => {
  it('shows the year, make and model, category, colour, price and photo', () => {
    renderCard(buildVehicle());

    expect(screen.getByRole('article', { name: '2023 Toyota Camry XSE' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '2023 Toyota Camry XSE' })).toBeInTheDocument();
    expect(screen.getByText('Sedan')).toBeInTheDocument();
    expect(screen.getByText('Celestial Silver')).toBeInTheDocument();
    expect(screen.getByText('$30,995')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '2023 Toyota Camry XSE' })).toHaveAttribute(
      'src',
      'https://images.example.test/camry.jpg',
    );
  });

  it.each([
    [4, '4 in stock'],
    [2, 'Only 2 left'],
    [1, 'Only 1 left'],
  ])('with %i units shows "%s" and an enabled Purchase button', (quantity, badge) => {
    renderCard(buildVehicle({ quantity }));

    expect(screen.getByText(badge)).toBeInTheDocument();
    expect(purchaseButton()).toHaveTextContent('Purchase');
    expect(purchaseButton()).toBeEnabled();
  });

  it('disables the Purchase button when the vehicle is out of stock', async () => {
    const { onPurchase, user } = renderCard(buildVehicle({ quantity: 0 }));

    expect(purchaseButton()).toBeDisabled();
    expect(purchaseButton()).toHaveTextContent('Sold out');
    await user.click(purchaseButton());
    expect(onPurchase).not.toHaveBeenCalled();
  });

  it('buys the vehicle with one click', async () => {
    const camry = buildVehicle();
    const { onPurchase, user } = renderCard(camry);

    await user.click(purchaseButton());

    expect(onPurchase).toHaveBeenCalledWith(camry);
  });

  it('shows a disabled "Buying…" state while the purchase is in progress', () => {
    renderCard(buildVehicle(), { purchasing: true });

    expect(purchaseButton()).toBeDisabled();
    expect(purchaseButton()).toHaveTextContent('Buying…');
  });

  it('hides the admin actions from regular users', () => {
    renderCard(buildVehicle());

    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /restock/i })).not.toBeInTheDocument();
  });

  it('gives admins Edit and Restock shortcuts', async () => {
    const camry = buildVehicle();
    const { onEdit, onRestock, user } = renderCard(camry, { isAdmin: true });

    await user.click(screen.getByRole('button', { name: 'Edit 2023 Toyota Camry XSE' }));
    await user.click(screen.getByRole('button', { name: 'Restock 2023 Toyota Camry XSE' }));

    expect(onEdit).toHaveBeenCalledWith(camry);
    expect(onRestock).toHaveBeenCalledWith(camry);
  });

  it('shows a placeholder when the photo cannot be loaded', () => {
    renderCard(buildVehicle());

    fireEvent.error(screen.getByRole('img', { name: '2023 Toyota Camry XSE' }));

    expect(screen.queryByRole('img', { name: '2023 Toyota Camry XSE' })).not.toBeInTheDocument();
    expect(screen.getByText('Photo unavailable')).toBeInTheDocument();
  });
});
