import { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle: { push: (obj: unknown) => void } | undefined;
  }
}

const PUBLISHER_ID = 'ca-pub-3444579012936819';

interface AdUnitProps {
  adSlot: string;
  adFormat?: 'auto' | 'fluid' | 'rectangle';
  adLayout?: 'in-feed' | 'in-article';
  className?: string;
  minHeight?: number;
}

export function AdUnit({ adSlot, adFormat = 'auto', adLayout, className, minHeight = 100 }: AdUnitProps) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || { push: () => {} }).push({});
    } catch {
      // 広告ブロッカーなどで失敗しても無視
    }
  }, []);

  return (
    <div style={{ minHeight: `${minHeight}px` }} className={className}>
      <p className="text-xs text-gray-400 text-center mb-1">広告</p>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
        {...(adLayout ? { 'data-ad-layout': adLayout } : {})}
        {...(import.meta.env.DEV ? { 'data-adtest': 'on' } : {})}
      />
    </div>
  );
}
