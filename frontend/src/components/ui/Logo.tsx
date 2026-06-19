interface Props {
  size?: 'sm' | 'md' | 'lg';
  showBeta?: boolean;
  className?: string;
  markOnly?: boolean;
}

export function Logo({ size = 'md', showBeta = false, className = '', markOnly = false }: Props) {
  const textSizes = {
    sm: 'text-lg font-bold',
    md: 'text-2xl font-bold',
    lg: 'text-3xl font-bold',
  };
  const markSizes = { sm: 20, md: 28, lg: 36 };
  const sz = markSizes[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Quill mark — a stylised nib/feather stroke */}
      <svg
        width={sz}
        height={sz}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Feather body */}
        <path
          d="M26 4C26 4 18 8 14 16C12 20 12 26 12 26L8 28C8 28 10 22 10 20C10 18 8 16 8 16C8 16 14 14 18 10C20 7 22 4 26 4Z"
          fill="url(#quill-grad)"
          opacity="0.9"
        />
        {/* Nib stroke */}
        <path
          d="M12 26L6 30"
          stroke="url(#quill-grad)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Quill spine */}
        <path
          d="M26 4L12 26"
          stroke="url(#quill-grad-2)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        <defs>
          <linearGradient id="quill-grad" x1="6" y1="30" x2="26" y2="4" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#A3E635" />
          </linearGradient>
          <linearGradient id="quill-grad-2" x1="12" y1="26" x2="26" y2="4" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#6EE7B7" />
          </linearGradient>
        </defs>
      </svg>

      {!markOnly && (
        <span className={`font-display tracking-tight text-[var(--text)] ${textSizes[size]}`}>
          Quillio.
        </span>
      )}

      {showBeta && !markOnly && (
        <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-quillio-500/15 text-quillio-500 border border-quillio-500/20 leading-none">
          Beta
        </span>
      )}
    </div>
  );
}
