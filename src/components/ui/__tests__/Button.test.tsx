import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Button from '@/components/ui/Button';

describe('Button', () => {
  it('renders children with the default variant and size classes', () => {
    render(<Button>Envoyer</Button>);

    const button = screen.getByRole('button', { name: 'Envoyer' });
    expect(button).toHaveClass('bg-madiba-red');
    expect(button).toHaveClass('h-11');
    expect(button).toHaveClass('px-6');
  });

  it('applies custom variant, width, and disabled state', () => {
    render(
      <Button variant="outline" size="lg" fullWidth disabled>
        Télécharger
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Télécharger' });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('border-madiba-gray');
    expect(button).toHaveClass('h-14');
    expect(button).toHaveClass('w-full');
  });
});
