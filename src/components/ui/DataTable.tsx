'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { EASE_EDITORIAL } from './Motion';

export interface Column<T> {
  /** Stable key; also the sort key when `sortable` is set. */
  id: string;
  header: React.ReactNode;
  /** Cell renderer for the desktop table and the mobile card. */
  cell: (row: T) => React.ReactNode;
  /** Value used for sorting; omit to make the column unsortable. */
  sortValue?: (row: T) => string | number;
  /** Hide the label on the mobile card (for the row's title cell). */
  primary?: boolean;
  /** Drop this column on the mobile card entirely. */
  hideOnMobile?: boolean;
  align?: 'left' | 'right';
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Rendered when `rows` is empty. */
  empty?: React.ReactNode;
  /** Fired when a row is activated (click or Enter). */
  onRowClick?: (row: T) => void;
  /** Trailing actions, rendered in their own cell / card footer. */
  actions?: (row: T) => React.ReactNode;
  caption?: string;
  className?: string;
}

type SortState = { id: string; dir: 'asc' | 'desc' } | null;

/**
 * A table on tablet and desktop; a stack of labelled cards on phones, where a
 * horizontally scrolling table is unusable. One definition drives both.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
  onRowClick,
  actions,
  caption,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>(null);
  const reduce = useReducedMotion();

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.id === sort.id);
    if (!col?.sortValue) return rows;

    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sort, columns]);

  const toggleSort = (id: string) => {
    setSort((prev) =>
      prev?.id === id
        ? prev.dir === 'asc'
          ? { id, dir: 'desc' }
          : null
        : { id, dir: 'asc' }
    );
  };

  if (rows.length === 0 && empty) return <>{empty}</>;

  const mobileColumns = columns.filter((c) => !c.hideOnMobile);

  return (
    <div className={className}>
      {/* ─── Table: tablet and up ─── */}
      <div className="hidden md:block rounded-2xl border border-hairline bg-surface-raised overflow-hidden shadow-e-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            {caption && <caption className="sr-only">{caption}</caption>}
            <thead>
              <tr className="bg-surface-sunken border-b border-hairline">
                {columns.map((col) => {
                  const isSorted = sort?.id === col.id;
                  return (
                    <th
                      key={col.id}
                      scope="col"
                      aria-sort={
                        isSorted
                          ? sort!.dir === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : col.sortValue
                            ? 'none'
                            : undefined
                      }
                      className={cn(
                        'px-4 py-3 text-eyebrow uppercase font-display text-ink-faint whitespace-nowrap',
                        col.align === 'right' && 'text-right'
                      )}
                    >
                      {col.sortValue ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(col.id)}
                          className={cn(
                            'inline-flex items-center gap-1.5 transition-colors hover:text-ink',
                            isSorted && 'text-ink'
                          )}
                        >
                          {col.header}
                          {isSorted ? (
                            sort!.dir === 'asc' ? (
                              <ArrowUp className="w-3 h-3" aria-hidden />
                            ) : (
                              <ArrowDown className="w-3 h-3" aria-hidden />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3 h-3 opacity-40" aria-hidden />
                          )}
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  );
                })}
                {actions && <th scope="col" className="px-4 py-3 w-px" />}
              </tr>
            </thead>

            <tbody className="divide-y divide-hairline">
              <AnimatePresence initial={false}>
                {sortedRows.map((row, i) => (
                  <motion.tr
                    key={rowKey(row)}
                    layout={!reduce}
                    initial={reduce ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? undefined : { opacity: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: Math.min(i * 0.02, 0.2),
                      ease: EASE_EDITORIAL,
                    }}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={
                      onRowClick
                        ? (e) => {
                            if (e.key === 'Enter') onRowClick(row);
                          }
                        : undefined
                    }
                    className={cn(
                      'transition-colors',
                      onRowClick && 'cursor-pointer hover:bg-surface-sunken focus:bg-surface-sunken focus:outline-none'
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.id}
                        className={cn(
                          'px-4 py-3.5 text-caption text-ink align-middle',
                          col.align === 'right' && 'text-right',
                          col.className
                        )}
                      >
                        {col.cell(row)}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        {actions(row)}
                      </td>
                    )}
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Cards: phones ─── */}
      <ul className="md:hidden space-y-3">
        <AnimatePresence initial={false}>
          {sortedRows.map((row, i) => (
            <motion.li
              key={rowKey(row)}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{
                duration: 0.3,
                delay: Math.min(i * 0.03, 0.25),
                ease: EASE_EDITORIAL,
              }}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'rounded-2xl border border-hairline bg-surface-raised shadow-e-1 overflow-hidden',
                onRowClick && 'active:scale-[0.99] transition-transform'
              )}
            >
              <dl className="p-4 space-y-2.5">
                {mobileColumns.map((col) =>
                  col.primary ? (
                    <div key={col.id} className="text-title-sm font-display font-bold text-ink">
                      {col.cell(row)}
                    </div>
                  ) : (
                    <div
                      key={col.id}
                      className="flex items-baseline justify-between gap-4 text-caption"
                    >
                      <dt className="text-ink-faint shrink-0">{col.header}</dt>
                      <dd className="text-ink font-medium text-right min-w-0 truncate">
                        {col.cell(row)}
                      </dd>
                    </div>
                  )
                )}
              </dl>

              {actions && (
                <div className="px-4 py-3 border-t border-hairline bg-surface-sunken flex items-center justify-end gap-2">
                  {actions(row)}
                </div>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
