import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'default' | 'outline' | 'small';

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  variant?: Variant;
  label?: string;
  children?: ReactNode;
};

const base =
  'inline-flex items-center justify-center rounded-[4px] font-mono font-medium text-[12px] leading-[12px] whitespace-nowrap';

const variantClass: Record<Variant, string> = {
  default: 'bg-confetti-black text-caresignal-white px-[12px] py-[8px]',
  outline: 'border border-confetti-black text-confetti-black px-[12px] py-[8px]',
  small: 'bg-confetti-black text-caresignal-white px-[8px] py-[6px]',
};

export default function Button({
  variant = 'default',
  label,
  children,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={`${base} ${variantClass[variant]}${className ? ` ${className}` : ''}`} {...rest}>
      {children ?? label}
    </button>
  );
}
