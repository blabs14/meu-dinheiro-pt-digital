import React from 'react';

interface SkeletonListProps {
  count?: number;
  variant?: 'card' | 'list';
  className?: string;
}

export function SkeletonList({ count = 3, variant = 'card', className = '' }: SkeletonListProps) {
  return (
    <div className={`grid gap-4 ${variant === 'card' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : ''} ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={
            variant === 'card'
              ? 'animate-pulse rounded-lg bg-muted h-40 w-full shadow-sm'
              : 'animate-pulse rounded bg-muted h-8 w-full'
          }
        />
      ))}
    </div>
  );
} 