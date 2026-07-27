import { render, screen } from '@testing-library/react';
import { Button, Input, Label } from '..';

describe('shared UI primitives', () => {
  it('composes an accessible Label and Input', () => {
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" aria-invalid="true" />
      </>,
    );

    expect(screen.getByLabelText('Email').getAttribute('aria-invalid')).toBe(
      'true',
    );
  });

  it('preserves native disabled Button behavior', () => {
    render(<Button disabled>Wait</Button>);

    expect(
      (screen.getByRole('button', { name: 'Wait' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});
