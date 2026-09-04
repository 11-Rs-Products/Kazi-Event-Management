'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface EventFilterProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  categories: string[];
}

const STATUSES = [
  { value: 'ALL', label: 'All' },
  { value: 'PUBLISHED', label: 'Open' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'COMPLETED', label: 'Completed' },
];

/** Pill toggle used for both the status and category rows. */
const FilterPill: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      'shrink-0 px-3.5 h-9 rounded-full border text-caption font-display font-semibold',
      'transition-colors duration-200 whitespace-nowrap',
      active
        ? 'bg-ink text-ink-invert border-ink'
        : 'bg-surface-raised text-ink-muted border-hairline hover:border-hairline-strong hover:text-ink'
    )}
  >
    {children}
  </button>
);

export const EventFilter: React.FC<EventFilterProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  categories,
}) => (
  <div className="space-y-3">
    <div className="relative">
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none"
        aria-hidden
      />
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search events, venues, categories…"
        aria-label="Search events"
        className="ed-field pl-11 pr-11"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => onSearchChange('')}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-ink-faint hover:text-ink hover:bg-surface-sunken transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>

    <div className="flex flex-wrap items-center gap-2">
      {STATUSES.map((s) => (
        <FilterPill
          key={s.value}
          active={selectedStatus === s.value}
          onClick={() => onStatusChange(s.value)}
        >
          {s.label}
        </FilterPill>
      ))}

      {categories.length > 0 && (
        <>
          <span className="w-px h-6 bg-hairline mx-1 hidden sm:block" aria-hidden />
          <FilterPill
            active={selectedCategory === 'ALL'}
            onClick={() => onCategoryChange('ALL')}
          >
            All categories
          </FilterPill>
          {categories.map((cat) => (
            <FilterPill
              key={cat}
              active={selectedCategory === cat}
              onClick={() => onCategoryChange(cat)}
            >
              {cat}
            </FilterPill>
          ))}
        </>
      )}
    </div>
  </div>
);
