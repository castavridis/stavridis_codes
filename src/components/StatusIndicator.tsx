import type { ReactNode } from 'react';

type Status = 'success' | 'warning' | 'danger' | 'none';

type StatusIndicatorProps = {
  status: Status;
  children?: ReactNode;
};

const bgClass: Record<Status, string> = {
  success: 'bg-grad-success-start',
  warning: 'bg-grad-warning-start',
  danger: 'bg-grad-danger-start',
  none: 'bg-grad-none-start',
};

export default function StatusIndicator({ status, children }: StatusIndicatorProps) {
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${bgClass[status]}`}
      style={{ width: '22.063px', height: '22.063px', borderRadius: '2.464px' }}
    >
      {children}
    </span>
  );
}
