import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../lib/theme';

interface Props {
  size?: 'sm' | 'md';
  className?: string;
}

export function ThemeToggle({ size = 'md', className = '' }: Props) {
  const { theme, toggle } = useTheme();
  const sz = size === 'sm' ? 14 : 18;

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className={`
        inline-flex items-center justify-center rounded-full transition-all duration-200
        ${size === 'sm' ? 'w-7 h-7' : 'w-9 h-9'}
        text-[var(--text-muted)] hover:text-[var(--text)]
        hover:bg-white/10 dark:hover:bg-white/10 hover:bg-black/5
        ${className}
      `}
    >
      {theme === 'dark'
        ? <Sun size={sz} strokeWidth={1.8} />
        : <Moon size={sz} strokeWidth={1.8} />
      }
    </button>
  );
}
