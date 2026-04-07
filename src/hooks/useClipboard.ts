import { useState, useRef, useEffect } from 'react';

export function useClipboard(resetDelay = 2000) {
  const [isCopied, setIsCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (!mountedRef.current) return;
      setIsCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (mountedRef.current) setIsCopied(false);
      }, resetDelay);
    } catch (err) {
      console.error('クリップボードへのコピーに失敗しました:', err);
    }
  };

  return { isCopied, copy };
}
