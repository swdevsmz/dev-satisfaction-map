import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClipboard } from './useClipboard';

describe('useClipboard', () => {
  const mockWriteText = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });
    mockWriteText.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('copy() 後に isCopied が true になる', async () => {
    const { result } = renderHook(() => useClipboard());
    await act(async () => {
      await result.current.copy('テストテキスト');
    });
    expect(result.current.isCopied).toBe(true);
  });

  it('デフォルト 2000ms 後に isCopied が false に戻る', async () => {
    const { result } = renderHook(() => useClipboard());
    await act(async () => {
      await result.current.copy('テストテキスト');
    });
    expect(result.current.isCopied).toBe(true);
    act(() => { vi.advanceTimersByTime(2000); });
    expect(result.current.isCopied).toBe(false);
  });

  it('カスタム resetDelay が適用される', async () => {
    const { result } = renderHook(() => useClipboard(500));
    await act(async () => {
      await result.current.copy('テストテキスト');
    });
    act(() => { vi.advanceTimersByTime(499); });
    expect(result.current.isCopied).toBe(true);
    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current.isCopied).toBe(false);
  });

  it('writeText 失敗時は isCopied が false のまま console.error が呼ばれる', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockWriteText.mockRejectedValue(new Error('Permission denied'));
    const { result } = renderHook(() => useClipboard());
    await act(async () => {
      await result.current.copy('テストテキスト');
    });
    expect(result.current.isCopied).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('アンマウント後にタイマーが発火しない', async () => {
    const { result, unmount } = renderHook(() => useClipboard());
    await act(async () => {
      await result.current.copy('テストテキスト');
    });
    unmount();
    // アンマウント後のタイマー発火でエラーが出ないことを確認
    expect(() => act(() => { vi.advanceTimersByTime(2000); })).not.toThrow();
  });
});
