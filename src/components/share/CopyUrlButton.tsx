import { useClipboard } from '../../hooks/useClipboard';

interface CopyUrlButtonProps {
  url: string;
  className?: string;
}

export function CopyUrlButton({ url, className }: CopyUrlButtonProps) {
  const { isCopied, copy } = useClipboard(2000);

  return (
    <div className={`relative ${className ?? ''}`}>
      <button
        onClick={() => copy(url)}
        aria-label="URLをコピー"
        className="flex items-center justify-center gap-1.5 min-w-[44px] min-h-[44px] px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        {isCopied ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-600" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="text-green-600">コピー済み</span>
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <span>URLをコピー</span>
          </>
        )}
      </button>

      {/* トースト通知 */}
      <div
        role="status"
        aria-live="polite"
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap transition-opacity duration-200 pointer-events-none ${
          isCopied ? 'opacity-100' : 'opacity-0'
        }`}
      >
        クリップボードにコピーしました
      </div>
    </div>
  );
}
