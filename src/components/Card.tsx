import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export default function Card({ children, className = '', noPadding = false }: CardProps) {
  return (
    <div
      className={`glass rounded-2xl w-full max-w-md overflow-hidden ${
        noPadding ? '' : 'p-8'
      } ${className}`}
    >
      {children}
    </div>
  );
}
