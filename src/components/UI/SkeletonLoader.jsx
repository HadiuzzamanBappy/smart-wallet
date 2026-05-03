import React from 'react';

/**
 * Base skeleton loading component with customizable dimensions
 */
const Skeleton = ({
  className = '',
  width = 'w-full',
  height = 'h-4',
  rounded = 'rounded-lg',
  animated = true
}) => (
  <div
    className={`
      bg-paper-100/50 dark:bg-white/[0.04]
      ${width} ${height} ${rounded} 
      ${animated ? 'animate-pulse' : ''}
      ${className}
    `}
  />
);

/**
 * Skeleton for transaction cards
 */
export const TransactionSkeleton = ({ count = 5 }) => (
  <div className="divide-y divide-paper-100 dark:divide-white/5">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="p-3">
        <div className="flex items-center gap-3">
          {/* Avatar Icon */}
          <div className="shrink-0">
            <Skeleton width="w-9" height="h-9" rounded="rounded-xl" />
          </div>

          {/* Description & Metadata */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton width="w-24 sm:w-40" height="h-3.5" rounded="rounded-md" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton width="w-10" height="h-2.5" rounded="rounded-sm" />
              <Skeleton width="w-16" height="h-2.5" rounded="rounded-sm" />
            </div>
          </div>

          {/* Amount & Actions */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Skeleton width="w-16 sm:w-20" height="h-4" rounded="rounded-md" />
            <div className="flex items-center gap-1.5">
              <Skeleton width="w-5" height="h-5" rounded="rounded-lg" />
              <Skeleton width="w-5" height="h-5" rounded="rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

/**
 * Skeleton for summary cards (CompactSummary)
 */
export const SummaryCardSkeleton = ({ count = 4 }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
    {Array.from({ length: count }, (_, index) => (
      <div
        key={index}
        className={`${index >= 2 ? 'col-span-2 md:col-span-1' : ''} relative overflow-hidden rounded-2xl p-3 bg-paper-100/30 dark:bg-white/[0.02] border border-paper-100 dark:border-white/5 flex items-center gap-2.5`}
      >
        <div className="shrink-0">
          <Skeleton width="w-8" height="h-8" rounded="rounded-xl" />
        </div>
        <div className="min-w-0 flex-1">
          <Skeleton width="w-14" height="h-2" className="mb-1.5" rounded="rounded-sm" />
          <Skeleton width="w-20" height="h-3.5" rounded="rounded-md" />
        </div>
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
  <div className="flex flex-col h-full">
    <div className="px-4 py-4 space-y-4 border-b border-paper-100 dark:border-white/5 bg-paper-100/10 dark:bg-white/[0.01]">
      {/* Header - Audit Log Count */}
      <div className="flex items-center gap-2">
        <Skeleton width="w-2" height="h-2" rounded="rounded-full" className="shadow-[0_0_8px_rgba(20,184,166,0.3)]" />
        <Skeleton width="w-40" height="h-3" rounded="rounded-sm" />
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <Skeleton width="w-full" height="h-8" rounded="rounded-xl" />
        <Skeleton width="w-full" height="h-8" rounded="rounded-xl" />
        <Skeleton width="w-full" height="h-8" rounded="rounded-xl" />
        <Skeleton width="w-full" height="h-8" rounded="rounded-xl" />
      </div>
    </div>

    {/* Transaction Items */}
    <TransactionSkeleton count={8} />

    {/* Pagination placeholder */}
    <div className="p-5 flex items-center justify-between bg-paper-100/10 dark:bg-white/[0.01] border-t border-paper-100 dark:border-white/5">
      <Skeleton width="w-24" height="h-3" />
      <div className="flex items-center gap-2">
        <Skeleton width="w-16" height="h-9" rounded="rounded-xl" />
        <Skeleton width="w-24" height="h-9" rounded="rounded-xl" />
        <Skeleton width="w-16" height="h-9" rounded="rounded-xl" />
      </div>
    </div>
  </div>
);

/**
 * Complete skeleton for compact summary
 */
export const CompactSummarySkeleton = () => (
  <div className="w-full">
    <SummaryCardSkeleton />
  </div>
);

/**
 * Skeleton specifically for the BudgetProgress card to match full-width layout
 */
export const BudgetSkeleton = () => (
  <div className="rounded-3xl p-4 bg-paper-100/30 dark:bg-white/[0.02] border border-paper-100 dark:border-white/5 w-full">
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <Skeleton width="w-8" height="h-8" rounded="rounded-xl" />
        <div className="flex-1 min-w-0">
          <Skeleton width="w-24" height="h-2.5" className="mb-1.5" />
          <Skeleton width="w-32" height="h-2.5" />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Skeleton width="w-8" height="h-4" rounded="rounded-lg" />
        <Skeleton width="w-7" height="h-7" rounded="rounded-full" />
      </div>
    </div>

    <div className="w-full mb-3">
      <Skeleton width="w-full" height="h-2.5" rounded="rounded-full" />
    </div>

    <div className="flex items-center justify-between">
      <Skeleton width="w-24" height="h-2" />
      <Skeleton width="w-28" height="h-2" />
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
  <div className="p-4 space-y-6">
    {/* Header */}
    <div className="flex items-center gap-4 mb-2">
      <Skeleton width="w-10" height="h-10" rounded="rounded-xl" />
      <div className="space-y-2">
        <Skeleton width="w-32" height="h-4" />
        <Skeleton width="w-24" height="h-3" />
      </div>
    </div>

    {/* Chart Placeholder */}
    <div className="rounded-3xl p-5 bg-paper-100/30 dark:bg-white/[0.02] border border-paper-100 dark:border-white/5 h-64 sm:h-72">
      <Skeleton width="w-full" height="h-full" rounded="rounded-xl" />
    </div>

    {/* Quick Stats Grid */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="p-4 rounded-3xl bg-white/50 dark:bg-white/[0.01] border border-paper-100/50 dark:border-white/5 flex flex-col items-center">
          <Skeleton width="w-8" height="h-8" rounded="rounded-lg" className="mb-3" />
          <Skeleton width="w-16" height="h-2.5" className="mb-2" />
          <Skeleton width="w-20" height="h-3" />
        </div>
      ))}
    </div>
  </div>
);

export default Skeleton;