import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdUnit } from './AdUnit';

describe('AdUnit', () => {
  beforeEach(() => {
    // window.adsbygoogle をモック
    Object.defineProperty(window, 'adsbygoogle', {
      value: { push: vi.fn() },
      writable: true,
      configurable: true,
    });
  });

  it('「広告」ラベルが表示される', () => {
    render(<AdUnit adSlot="1234567890" />);
    expect(screen.getByText('広告')).toBeInTheDocument();
  });

  it('adSlot が data-ad-slot 属性に設定される', () => {
    const { container } = render(<AdUnit adSlot="1234567890" />);
    const ins = container.querySelector('ins');
    expect(ins).toHaveAttribute('data-ad-slot', '1234567890');
  });

  it('minHeight のスタイルが適用される', () => {
    const { container } = render(<AdUnit adSlot="1234567890" minHeight={150} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.minHeight).toBe('150px');
  });

  it('window.adsbygoogle が undefined でもクラッシュしない', () => {
    Object.defineProperty(window, 'adsbygoogle', { value: undefined, configurable: true });
    expect(() => render(<AdUnit adSlot="1234567890" />)).not.toThrow();
  });
});
