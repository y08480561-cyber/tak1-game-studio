import { useState } from 'react';

interface SafeMediaProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function SafeMedia({ src, alt, className = '', fallbackTitle }: SafeMediaProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#12141b] via-[#0b0c10] to-[#17130a] border border-white/10 ${className}`}
        role="img"
        aria-label={alt}
      >
        <svg
          className="w-12 h-12 text-[#D4AF37]/45"
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="24" cy="24" r="19" stroke="currentColor" strokeWidth="1.5" />
          <path d="M16 18H26L21 32" stroke="#CBD5E1" strokeWidth="2.2" strokeLinecap="square" />
          <path d="M29 18V32" stroke="#D4AF37" strokeWidth="2.2" strokeLinecap="square" />
        </svg>
        {fallbackTitle && (
          <span className="mt-2 px-3 text-center text-xs text-slate-400 truncate max-w-full">
            {fallbackTitle}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
