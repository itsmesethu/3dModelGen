import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={clsx('bg-slate-800 border border-slate-700 rounded-lg p-6', className)}
      {...props}
    >
      {children}
    </div>
  );
}
