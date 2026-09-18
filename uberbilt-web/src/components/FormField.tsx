import { useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import { cx } from '../lib/cx';

interface FieldShellProps {
  label: string;
  children: ReactNode;
}

function FieldShell({ label, children }: FieldShellProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-[15px] font-semibold text-brand">{label}</span>
      {children}
    </label>
  );
}

const fieldClass =
  'h-[52px] w-full rounded-[14px] border-0 bg-well px-4 text-[15px] text-ink shadow-inset placeholder:text-muted/55';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export function TextField({ label, className, ...props }: TextFieldProps) {
  return (
    <FieldShell label={label}>
      <input type="text" className={cx(fieldClass, className)} {...props} />
    </FieldShell>
  );
}

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export function PasswordField({ label, className, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <FieldShell label={label}>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          className={cx(fieldClass, 'pr-12', className)}
          {...props}
        />
        <button
          type="button"
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted/70"
        >
          {visible ? (
            <Eye className="h-5 w-5" strokeWidth={1.75} />
          ) : (
            <EyeOff className="h-5 w-5" strokeWidth={1.75} />
          )}
        </button>
      </div>
    </FieldShell>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

export function SelectField({ label, className, children, ...props }: SelectFieldProps) {
  return (
    <FieldShell label={label}>
      <div className="relative">
        <select className={cx(fieldClass, 'pr-10', className)} {...props}>
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted/70"
          strokeWidth={1.75}
        />
      </div>
    </FieldShell>
  );
}
