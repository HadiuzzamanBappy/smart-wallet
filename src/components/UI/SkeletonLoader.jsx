import React from 'react';

/**
 * Base skeleton loading component with customizable dimensions
 */
const Skeleton = ({ 
  className = '', 
  width = 'w-full', 
  height = 'h-4',
  rounded = 'rounded',
  animated = true 
}) => (
  <div 
    className={`
      bg-gray-200 dark:bg-gray-700 
      ${width} ${height} ${rounded} 
      ${animated ? 'animate-pulse' : ''}
      ${className}
    `}
  />
);

/**
 * Skeleton for transaction cards
 */
export const TransactionSkeleton = ({ count = 1, showActions = true }) => (
  <>
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
        {/* Mobile Layout */}
        <div className="sm:hidden">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <Skeleton width="w-6" height="h-6" rounded="rounded-full" />
              <div className="flex-1 min-w-0">
                <Skeleton width="w-32" height="h-4" className="mb-1" />
                <Skeleton width="w-24" height="h-3" />
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-2">
              <Skeleton width="w-20" height="h-4" />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-wrap">
              <Skeleton width="w-16" height="h-5" rounded="rounded-full" />
              <Skeleton width="w-12" height="h-3" />
            </div>
            
            {showActions && (
              <div className="flex items-center space-x-1">
                <Skeleton width="w-6" height="h-6" rounded="rounded" />
                <Skeleton width="w-6" height="h-6" rounded="rounded" />
              </div>
            )}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center space-x-4">
          {/* Category & Type Icon */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Skeleton width="w-6" height="h-6" rounded="rounded-full" />
            <Skeleton width="w-4" height="h-4" rounded="rounded" />
          </div>

          {/* Transaction Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <Skeleton width="w-40" height="h-4" />
              <Skeleton width="w-24" height="h-4" />
            </div>
            <div className="flex items-center space-x-3 flex-wrap">
              <Skeleton width="w-20" height="h-5" rounded="rounded-full" />
              <Skeleton width="w-16" height="h-3" />
              <Skeleton width="w-12" height="h-3" />
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Skeleton width="w-8" height="h-8" rounded="rounded-lg" />
              <Skeleton width="w-8" height="h-8" rounded="rounded-lg" />
            </div>
          )}
        </div>
      </div>
    ))}
  </>
);

/**
 * Skeleton for summary cards (CompactSummary)
 */
export const SummaryCardSkeleton = ({ count = 4 }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
    {Array.from({ length: count }, (_, index) => (
      <div
        key={index}
        className="relative flex items-center gap-2 p-2 sm:p-4 rounded-lg bg-white/5 dark:bg-gray-800/40"
      >
        <div className="flex-shrink-0">
          <Skeleton width="w-8" height="h-8" rounded="rounded-md" />
        </div>
        <div className="min-w-0 flex-1 pr-6">
          <Skeleton width="w-20" height="h-3" className="mb-1" />
          <Skeleton width="w-16" height="h-4" />
        </div>
        {/* Optional action button skeleton for some cards */}
        {(index === 2 || index === 3) && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <Skeleton width="w-6" height="h-6" rounded="rounded-full" />
          </div>
        )}
      </div>
    ))}
  </div>
);

/**
 * Skeleton for header section (greeting + refresh button)
 */
export const HeaderSkeleton = () => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex-1">
      <Skeleton width="w-40" height="h-4" className="mb-1" />
      <Skeleton width="w-28" height="h-3" />
    </div>
    <Skeleton width="w-8" height="h-8" rounded="rounded" />
  </div>
);

/**
 * Skeleton for transaction list filters
 */
export const FilterSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
    <div className="sm:col-span-2 lg:col-span-1">
      <Skeleton width="w-full" height="h-10" rounded="rounded-lg" />
    </div>
    <Skeleton width="w-full" height="h-10" rounded="rounded-lg" />
    <Skeleton width="w-full" height="h-10" rounded="rounded-lg" />
    <Skeleton width="w-full" height="h-10" rounded="rounded-lg" />
  </div>
);

/**
 * Complete skeleton for transaction list
 */
export const TransactionListSkeleton = () => (
  <div className="card">
    <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <Skeleton width="w-40" height="h-6" />
        <Skeleton width="w-32" height="h-4" />
      </div>

      {/* Filters */}
      <FilterSkeleton />
    </div>

    {/* Transaction Items */}
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      <TransactionSkeleton count={8} />
    </div>

    {/* Pagination placeholder */}
    <div className="p-4 flex items-center justify-between">
      <Skeleton width="w-20" height="h-4" />
      <div className="flex items-center space-x-2">
        <Skeleton width="w-12" height="h-8" rounded="rounded-md" />
        <Skeleton width="w-8" height="h-8" rounded="rounded-md" />
        <Skeleton width="w-8" height="h-8" rounded="rounded-md" />
        <Skeleton width="w-12" height="h-8" rounded="rounded-md" />
      </div>
    </div>
  </div>
);

/**
 * Complete skeleton for compact summary
 */
export const CompactSummarySkeleton = () => (
  <div className="w-full">
    <HeaderSkeleton />
    <div className="flex gap-3">
      <div className="w-full">
        <SummaryCardSkeleton />
      </div>
    </div>
  </div>
);

/**
 * Skeleton specifically for the BudgetProgress card to match full-width layout
 */
export const BudgetSkeleton = () => (
  <div className="rounded-md p-3 bg-white/5 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 w-full">
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="p-2 rounded-lg bg-white/10 dark:bg-gray-700">
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-md animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="w-28 h-3 bg-gray-200 dark:bg-gray-700 rounded mb-1 animate-pulse" />
          <div className="w-40 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
      </div>
    </div>

    <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
      <div className="h-3 rounded-full bg-gray-300 dark:bg-gray-600 w-1/4 animate-pulse" />
    </div>

    <div className="flex items-center justify-between text-xs">
      <div className="w-32 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      <div className="w-36 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    </div>
  </div>
);

/**
 * Skeleton for chat widget messages
 */
export const ChatMessageSkeleton = ({ count = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="flex items-start space-x-3">
        <Skeleton width="w-8" height="h-8" rounded="rounded-full" />
        <div className="flex-1">
          <Skeleton width="w-3/4" height="h-4" className="mb-2" />
          <Skeleton width="w-1/2" height="h-3" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Skeleton for analytics charts
 */
export const AnalyticsSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Chart placeholder */}
      <div className="aspect-square">
        <Skeleton width="w-full" height="h-full" rounded="rounded-lg" />
      </div>
      
      {/* Legend placeholder */}
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="flex items-center space-x-3">
            <Skeleton width="w-4" height="h-4" rounded="rounded-full" />
            <Skeleton width="w-24" height="h-4" />
            <Skeleton width="w-16" height="h-4" className="ml-auto" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Skeleton;