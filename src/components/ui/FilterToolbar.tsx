'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import { FilterModal } from './FilterModal';
import { cn } from '@/lib/utils/cn';

export interface FilterToolbarProps {
  search?: React.ReactNode;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  totalCount?: number;
  filteredCount?: number;
  countLabel?: string;
  hasActiveFilters?: boolean;
  filterCount?: number;
  filterTitle?: string;
  onReset?: () => void;
  variant?: 'card' | 'bare';
  className?: string;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  search,
  filters,
  actions,
  totalCount,
  filteredCount,
  countLabel = 'items',
  hasActiveFilters = false,
  filterCount,
  filterTitle = 'Filter options',
  onReset,
  variant = 'card',
  className,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showMeta =
    typeof totalCount === 'number' && typeof filteredCount === 'number';

  const computedFilterCount =
    typeof filterCount === 'number'
      ? filterCount
      : hasActiveFilters
      ? 1
      : 0;

  const content = (
    <div className={cn('space-y-2.5', className)}>
      {/* Unified Single Row: Search + Filter Trigger + Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5 w-full">
        {search && <div className="flex-1 min-w-0">{search}</div>}

        {filters && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            aria-label="Open filter options"
            className={cn(
              'relative shrink-0 h-10 rounded-xl border-2 font-display font-black text-caption',
              'inline-flex items-center justify-center transition-all cursor-pointer select-none',
              'w-10 sm:w-auto px-0 sm:px-4 gap-1.5 sm:gap-2',
              'border-black dark:border-white shadow-[2px_2px_0px_#121212] dark:shadow-[2px_2px_0px_#FFFFFF]',
              'hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
              hasActiveFilters
                ? 'bg-[#FFE873] text-black'
                : 'bg-surface-raised dark:bg-surface-sunken text-ink hover:bg-surface-sunken'
            )}
          >
            <SlidersHorizontal
              className={cn(
                'w-4 h-4 shrink-0 stroke-[2.5] transition-colors',
                hasActiveFilters ? 'text-black' : 'text-ink-muted'
              )}
              aria-hidden="true"
            />
            <span className="hidden sm:inline text-caption">Filters</span>
            {hasActiveFilters && computedFilterCount > 0 && (
              <span
                className={cn(
                  'rounded-full font-mono font-black leading-none border border-black',
                  // Mobile: badge at top right corner of the square icon button
                  'max-sm:absolute max-sm:-top-1.5 max-sm:-right-1.5 max-sm:min-w-[1.125rem] max-sm:h-[1.125rem] max-sm:px-1 max-sm:text-[0.625rem] max-sm:flex max-sm:items-center max-sm:justify-center',
                  'max-sm:bg-[#FF708F] max-sm:text-white',
                  // Desktop: inline chip next to text
                  'sm:px-2 sm:py-0.5 sm:text-[0.625rem]',
                  'sm:bg-black sm:text-white dark:sm:bg-black dark:sm:text-white'
                )}
              >
                {computedFilterCount}
              </span>
            )}
          </button>
        )}

        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {/* Subtle meta strip: Only shown when filtering or searching is active */}
      {(hasActiveFilters || (showMeta && totalCount !== filteredCount)) && (
        <div className="flex items-center justify-between text-micro text-ink-muted px-0.5 pt-0.5 animate-fade-in">
          {showMeta ? (
            <span>
              Showing <strong className="font-semibold text-ink">{filteredCount}</strong> of{' '}
              {totalCount} {countLabel}
            </span>
          ) : (
            <span />
          )}

          {hasActiveFilters && onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 text-micro font-semibold text-accent hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" aria-hidden="true" />
              <span>Reset filters</span>
            </button>
          )}
        </div>
      )}

      {/* Filter Modal Sheet */}
      {filters && (
        <FilterModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={filterTitle}
          activeFilterCount={computedFilterCount}
          onReset={onReset}
          resultsCount={filteredCount}
          countLabel={countLabel}
        >
          {filters}
        </FilterModal>
      )}
    </div>
  );

  if (variant === 'bare') {
    return <div className="w-full">{content}</div>;
  }

  return (
    <Card elevation={1} className="p-3 sm:p-4">
      {content}
    </Card>
  );
};
