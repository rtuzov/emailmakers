/**
 * 🔧 CLIENT-ONLY WRAPPER COMPONENT
 * 
 * Компонент-обертка для предотвращения hydration mismatches
 * Использует Suspense-like паттерн для client-only контента
 */

'use client'

import React from 'react';
import { useClientOnly } from '../../hooks/useClientOnly';

interface ClientOnlyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

/**
 * Обертка для рендеринга контента только на клиенте
 * Предотвращает hydration errors
 */
export function ClientOnlyWrapper({ 
  children, 
  fallback = null, 
  className 
}: ClientOnlyWrapperProps) {
  const isClient = useClientOnly();

  if (!isClient) {
    return fallback ? (
      <div className={className}>{fallback}</div>
    ) : null;
  }

  return <div className={className}>{children}</div>;
}

/**
 * Skeleton компонент для loading состояний
 */
export function LoadingSkeleton({ 
  className = "",
  height = "h-4",
  count = 1
}: {
  className?: string;
  height?: string;
  count?: number;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${height}`}
        />
      ))}
    </div>
  );
}

/**
 * Fallback для dashboard компонентов
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <LoadingSkeleton height="h-8" className="w-48" />
        <LoadingSkeleton height="h-6" className="w-24" />
      </div>
      
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <LoadingSkeleton height="h-4" className="w-20 mb-2" />
            <LoadingSkeleton height="h-8" className="w-16 mb-1" />
            <LoadingSkeleton height="h-3" className="w-24" />
          </div>
        ))}
      </div>
      
      {/* Chart skeleton */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
        <LoadingSkeleton height="h-6" className="w-32 mb-4" />
        <LoadingSkeleton height="h-64" className="w-full" />
      </div>
    </div>
  );
}