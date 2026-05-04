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
      bg-paper-200/60 dark:bg-white/5
      shadow-sm shadow-paper-200/40 dark:shadow-black/20
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
  <div className="divide-y divide-paper-200/50 dark:divide-white/5">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="p-4">
        <div className="flex items-center gap-4">
          {/* Avatar Icon */}
          <div className="shrink-0">
            <Skeleton width="w-10" height="h-10" rounded="rounded-2xl" />
          </div>

          {/* Description & Metadata */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton width="w-32 sm:w-48" height="h-3.5" rounded="rounded-md" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton width="w-12" height="h-2.5" rounded="rounded-sm" />
              <Skeleton width="w-20" height="h-2.5" rounded="rounded-sm" />
            </div>
          </div>

          {/* Amount & Actions */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Skeleton width="w-20 sm:w-24" height="h-4" rounded="rounded-md" />
            <div className="flex items-center gap-1.5">
              <Skeleton width="w-5" height="h-5" rounded="rounded-xl" />
              <Skeleton width="w-5" height="h-5" rounded="rounded-xl" />
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
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    {Array.from({ length: count }, (_, index) => (
      <div
        key={index}
        className="relative overflow-hidden rounded-3xl p-3.5 bg-paper-100/50 dark:bg-white/[0.02] border border-paper-200/60 dark:border-white/5 flex flex-col gap-3"
      >
        <div className="flex items-center justify-between">
          <Skeleton width="w-8" height="h-8" rounded="rounded-xl" />
          {index >= 2 && <Skeleton width="w-5" height="h-5" rounded="rounded-lg" />}
        </div>
        <div className="min-w-0">
          <Skeleton width="w-12" height="h-2.5" className="mb-2" rounded="rounded-sm" />
          <Skeleton width="w-24" height="h-4.5" rounded="rounded-md" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Skeleton for header section (greeting + refresh button)
 */
export const HeaderSkeleton = () => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex-1">
      <Skeleton width="w-48" height="h-5" className="mb-2" />
      <Skeleton width="w-32" height="h-3.5" />
    </div>
    <Skeleton width="w-10" height="h-10" rounded="rounded-xl" />
  </div>
);

/**
 * Skeleton for transaction list filters
 */
export const FilterSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
    <div className="sm:col-span-2 lg:col-span-1">
      <Skeleton width="w-full" height="h-10" rounded="rounded-2xl" />
    </div>
    <Skeleton width="w-full" height="h-10" rounded="rounded-2xl" />
    <Skeleton width="w-full" height="h-10" rounded="rounded-2xl" />
    <Skeleton width="w-full" height="h-10" rounded="rounded-2xl" />
  </div>
);

/**
 * Complete skeleton for transaction list
 */
export const TransactionListSkeleton = () => (
  <div className="flex flex-col h-full bg-surface-card dark:bg-surface-card-dark rounded-[2.5rem] overflow-hidden border border-paper-200/60 dark:border-white/5">
    <div className="px-5 py-5 space-y-4 border-b border-paper-200/60 dark:border-white/5 bg-paper-100/30 dark:bg-white/[0.01]">
      {/* Header - Audit Log Count */}
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-primary-500/30 animate-pulse" />
        <Skeleton width="w-48" height="h-3" rounded="rounded-sm" />
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <Skeleton width="w-full" height="h-9" rounded="rounded-2xl" />
        <Skeleton width="w-full" height="h-9" rounded="rounded-2xl" />
        <Skeleton width="w-full" height="h-9" rounded="rounded-2xl" />
        <Skeleton width="w-full" height="h-9" rounded="rounded-2xl" />
      </div>
    </div>

    {/* Transaction Items */}
    <TransactionSkeleton count={4} />

    {/* Pagination placeholder */}
    <div className="p-6 flex items-center justify-between bg-paper-100/30 dark:bg-white/[0.01] border-t border-paper-200/60 dark:border-white/5">
      <Skeleton width="w-32" height="h-3.5" />
      <div className="flex items-center gap-3">
        <Skeleton width="w-20" height="h-10" rounded="rounded-2xl" />
        <Skeleton width="w-32" height="h-10" rounded="rounded-2xl" />
        <Skeleton width="w-20" height="h-10" rounded="rounded-2xl" />
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
  <div className="rounded-[2rem] p-5 bg-paper-100/30 dark:bg-white/[0.02] border border-paper-200/60 dark:border-white/5 w-full">
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Skeleton width="w-10" height="h-10" rounded="rounded-2xl" />
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton width="w-28" height="h-3" />
          <Skeleton width="w-40" height="h-3" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Skeleton width="w-10" height="h-5" rounded="rounded-xl" />
        <Skeleton width="w-8" height="h-8" rounded="rounded-full" />
      </div>
    </div>

    <div className="w-full mb-4">
      <Skeleton width="w-full" height="h-3" rounded="rounded-full" />
    </div>

    <div className="flex items-center justify-between">
      <Skeleton width="w-28" height="h-2.5" />
      <Skeleton width="w-32" height="h-2.5" />
    </div>
  </div>
);

/**
 * Skeleton for chat widget messages
 */
export const ChatMessageSkeleton = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="flex items-start gap-3">
        <Skeleton width="w-9" height="h-9" rounded="rounded-2xl" />
        <div className="flex-1 space-y-2.5">
          <Skeleton width="w-3/4" height="h-4" rounded="rounded-xl" />
          <Skeleton width="w-1/2" height="h-3.5" rounded="rounded-xl" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Skeleton for analytics charts
 */
export const AnalyticsSkeleton = () => (
  <div className="p-5 space-y-8">
    {/* Header */}
    <div className="flex items-center gap-5 mb-2">
      <Skeleton width="w-12" height="h-12" rounded="rounded-2xl" />
      <div className="space-y-2.5">
        <Skeleton width="w-40" height="h-4.5" />
        <Skeleton width="w-28" height="h-3.5" />
      </div>
    </div>

    {/* Chart Placeholder */}
    <div className="rounded-[2.5rem] p-6 bg-paper-100/30 dark:bg-white/[0.02] border border-paper-200/60 dark:border-white/5 h-72 sm:h-80">
      <Skeleton width="w-full" height="h-full" rounded="rounded-[2rem]" />
    </div>

    {/* Quick Stats Grid */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="p-5 rounded-[2rem] bg-paper-100/30 dark:bg-white/[0.01] border border-paper-200/60 dark:border-white/5 flex flex-col items-center">
          <Skeleton width="w-9" height="h-9" rounded="rounded-2xl" className="mb-4" />
          <Skeleton width="w-20" height="h-3" className="mb-2" />
          <Skeleton width="w-24" height="h-4" />
        </div>
      ))}
    </div>
  </div>
);

export default Skeleton;