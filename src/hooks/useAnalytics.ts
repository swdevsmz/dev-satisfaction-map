declare global {
  interface Window {
    gtag: (command: string, ...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

type AnalyticsEvent =
  | { name: 'company_view'; company_name: string; happiness_score: number }
  | { name: 'share'; platform: 'twitter' | 'facebook' }
  | { name: 'copy_url' };

export function useAnalytics() {
  const isDnt = navigator.doNotTrack === '1';

  const send = (command: string, ...args: unknown[]) => {
    if (isDnt || typeof window.gtag !== 'function') return;
    window.gtag(command, ...args);
  };

  const trackPageView = (path: string) => {
    send('event', 'page_view', { page_path: path });
  };

  const trackEvent = (event: AnalyticsEvent) => {
    const { name, ...params } = event;
    send('event', name, params);
  };

  return { trackPageView, trackEvent };
}
