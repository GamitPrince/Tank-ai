import { cx } from '../lib/cx';

interface LogoProps {
  variant?: 'split' | 'brand';
  size?: 'md' | 'lg';
}

export function Logo({ variant = 'split', size = 'md' }: LogoProps) {
  const restColor = variant === 'brand' ? '#F37121' : 'var(--color-logo-rest)';
  const text = size === 'lg' ? 'text-[44px]' : 'text-[28px]';

  return (
    <div className={cx('relative inline-flex items-start select-none', text)} aria-label="UBERBILT">
      <span className="font-display font-bold leading-none tracking-tight text-brand">U</span>
      <span className="font-display font-bold leading-none tracking-tight" style={{ color: restColor }}>
        BERBILT
      </span>
      <span
        className="absolute -right-[6px] top-[3px] h-0 w-0 rotate-[18deg] border-x-[4px] border-b-[7px] border-x-transparent border-b-brand"
        aria-hidden
      />
    </div>
  );
}
