import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Modal } from './Modal';

function Harness({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const close = () => {
    onClose?.();
    setOpen(false);
  };
  return (
    <>
      <button onClick={() => setOpen(true)}>Open editor</button>
      <Modal open={open} onClose={close} title="Edit vehicle" description="Change any field.">
        <input aria-label="Make" />
        <button>Save</button>
      </Modal>
    </>
  );
}

async function openModal(onClose?: () => void) {
  const user = userEvent.setup();
  render(<Harness onClose={onClose} />);
  await user.click(screen.getByRole('button', { name: 'Open editor' }));
  return user;
}

describe('Modal', () => {
  it('renders nothing while closed', () => {
    render(<Harness />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is an accessible modal dialog named by its title', async () => {
    await openModal();

    const dialog = screen.getByRole('dialog', { name: 'Edit vehicle' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription('Change any field.');
  });

  it('moves focus to the first focusable element inside', async () => {
    await openModal();

    expect(screen.getByRole('button', { name: /close/i })).toHaveFocus();
  });

  it('keeps Tab and Shift+Tab inside the dialog', async () => {
    const user = await openModal();
    const close = screen.getByRole('button', { name: /close/i });
    const save = screen.getByRole('button', { name: 'Save' });

    await user.tab();
    expect(screen.getByLabelText('Make')).toHaveFocus();
    await user.tab();
    expect(save).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
    await user.tab({ shift: true });
    expect(save).toHaveFocus();
  });

  it('closes on Escape and returns focus to the button that opened it', async () => {
    const onClose = vi.fn();
    const user = await openModal(onClose);

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open editor' })).toHaveFocus();
  });

  it('closes when the backdrop is clicked, but not when the panel is', async () => {
    const onClose = vi.fn();
    const user = await openModal(onClose);

    await user.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByTestId('modal-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes with the close button', async () => {
    const onClose = vi.fn();
    const user = await openModal(onClose);

    await user.click(screen.getByRole('button', { name: /close/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
