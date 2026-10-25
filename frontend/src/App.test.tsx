import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('App', () => {
  it('renders the dealership name', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /drivewright/i })).toBeInTheDocument();
  });
});
