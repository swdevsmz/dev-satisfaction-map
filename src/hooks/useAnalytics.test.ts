import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAnalytics } from './useAnalytics';

describe('useAnalytics', () => {
  const mockGtag = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('gtag', mockGtag);
    Object.defineProperty(navigator, 'doNotTrack', {
      value: null,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('Do Not Track が有効な場合、gtag を呼び出さない', () => {
    Object.defineProperty(navigator, 'doNotTrack', { value: '1', configurable: true });
    const { result } = renderHook(() => useAnalytics());
    result.current.trackPageView('/test');
    expect(mockGtag).not.toHaveBeenCalled();
  });

  it('window.gtag が未定義の場合、エラーなく動作する', () => {
    vi.stubGlobal('gtag', undefined);
    const { result } = renderHook(() => useAnalytics());
    expect(() => result.current.trackPageView('/test')).not.toThrow();
  });

  it('trackPageView が page_view イベントを正しく送信する', () => {
    const { result } = renderHook(() => useAnalytics());
    result.current.trackPageView('/companies');
    expect(mockGtag).toHaveBeenCalledWith('event', 'page_view', { page_path: '/companies' });
  });

  it('trackEvent が company_view イベントを正しく送信する', () => {
    const { result } = renderHook(() => useAnalytics());
    result.current.trackEvent({ name: 'company_view', company_name: 'テスト株式会社', happiness_score: 85 });
    expect(mockGtag).toHaveBeenCalledWith('event', 'company_view', {
      company_name: 'テスト株式会社',
      happiness_score: 85,
    });
  });

  it('trackEvent が share イベントを正しく送信する', () => {
    const { result } = renderHook(() => useAnalytics());
    result.current.trackEvent({ name: 'share', platform: 'twitter' });
    expect(mockGtag).toHaveBeenCalledWith('event', 'share', { platform: 'twitter' });
  });
});
