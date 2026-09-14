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
      'shrink-0 px-4 h-9 rounded-full border-2 border-black dark:border-white text-caption font-display font-black tracking-wide',
      'transition-all duration-150 whitespace-nowrap active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
      active
        ? 'bg-[#FFE873] text-black shadow-[2px_2px_0px_#121212] dark:shadow-[2px_2px_0px_#FFFFFF]'
        : 'bg-surface-raised text-ink hover:bg-[#FFE873]/20 shadow-[2px_2px_0px_#121212] dark:shadow-[2px_2px_0px_#FFFFFF]'
    )}
  >
    {active ? `✦ ${children}` : children}
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
          <span className="w-[2px] h-6 bg-black dark:bg-white mx-1 hidden sm:block" aria-hidden />
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
