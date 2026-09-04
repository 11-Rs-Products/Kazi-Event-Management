'use client';

import React, { useState, useMemo } from 'react';
import { Registration, EventItem, MainEvent } from '@/types';
import {
  Search,
  SlidersHorizontal,
  Eye,
  ShieldAlert,
  SearchX,
  X,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { DataTable, type Column } from '../ui/DataTable';
import { CSVExportButton } from './CSVExportButton';
import { useToast } from '../ui/Toast';
import { cn } from '@/lib/utils/cn';

interface RegistrationTableProps {
  registrations: Registration[];
  events: EventItem[];
  mainEvents: MainEvent[];
}

export const RegistrationTable: React.FC<RegistrationTableProps> = ({
  registrations,
  events,
  mainEvents,
}) => {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMainEventId, setSelectedMainEventId] = useState('ALL');
  const [selectedEventId, setSelectedEventId] = useState('ALL');
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [selectedProgramme, setSelectedProgramme] = useState('ALL');
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filtered registrations
  const filteredData = useMemo(() => {
    return registrations.filter((reg) => {
      const matchSearch =
        searchQuery === '' ||
        reg.nameSnapshot.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.emailSnapshot.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (reg.phoneSnapshot && reg.phoneSnapshot.includes(searchQuery)) ||
        (reg.eventTitle && reg.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchMainEvent =
        selectedMainEventId === 'ALL' || reg.mainEventId === selectedMainEventId;
      const matchEvent = selectedEventId === 'ALL' || reg.eventId === selectedEventId;
      const matchRegion = selectedRegion === 'ALL' || reg.regionSnapshot === selectedRegion;
      const matchLevel = selectedLevel === 'ALL' || reg.levelSnapshot === selectedLevel;
      const matchProgramme =
        selectedProgramme === 'ALL' || reg.programmeSnapshot === selectedProgramme;

      return (
        matchSearch && matchMainEvent && matchEvent && matchRegion && matchLevel && matchProgramme
      );
    });
  }, [
    registrations,
    searchQuery,
    selectedMainEventId,
    selectedEventId,
    selectedRegion,
    selectedLevel,
    selectedProgramme,
  ]);

  const hasActiveFilters =
    selectedMainEventId !== 'ALL' ||
    selectedEventId !== 'ALL' ||
    selectedRegion !== 'ALL' ||
    selectedLevel !== 'ALL' ||
    selectedProgramme !== 'ALL' ||
    searchQuery !== '';

  const resetFilters = () => {
    setSelectedMainEventId('ALL');
    setSelectedEventId('ALL');
    setSelectedRegion('ALL');
    setSelectedLevel('ALL');
    setSelectedProgramme('ALL');
    setSearchQuery('');
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map((r) => r.id)));
    }
  };

  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopySelectedEmails = async () => {
    const selectedRegs = filteredData.filter((r) => selectedIds.has(r.id));
    const emails = Array.from(new Set(selectedRegs.map((r) => r.emailSnapshot).filter(Boolean)));
    if (emails.length === 0) return;
    await navigator.clipboard.writeText(emails.join(', '));
    toast.success(`${emails.length} email addresses copied!`);
  };

  const isUrl = (v?: string) => !!v && (v.startsWith('http://') || v.startsWith('https://'));

  const columns: Column<Registration>[] = [
    {
      id: 'select',
      header: (
        <input
          type="checkbox"
          checked={filteredData.length > 0 && selectedIds.size === filteredData.length}
          onChange={toggleSelectAll}
          aria-label="Select all registrations"
          className="rounded border-hairline-strong text-brand focus:ring-brand w-4 h-4 cursor-pointer"
        />
      ),
      hideOnMobile: true,
      cell: (r) => (
        <input
          type="checkbox"
          checked={selectedIds.has(r.id)}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => toggleSelectOne(r.id, e as any)}
          aria-label={`Select ${r.nameSnapshot}`}
          className="rounded border-hairline-strong text-brand focus:ring-brand w-4 h-4 cursor-pointer"
        />
      ),
    },
    {
      id: 'student',
      header: 'Student',
      primary: true,
      sortValue: (r) => r.nameSnapshot,
      cell: (r) => (
        <div className="min-w-0">
          <div className="font-semibold text-ink truncate">{r.nameSnapshot}</div>
          <div className="text-micro font-mono text-ink-faint truncate">{r.emailSnapshot}</div>
        </div>
      ),
    },
    {
      id: 'event',
      header: 'Event',
      sortValue: (r) => r.eventTitle || '',
      cell: (r) => <span className="text-ink-muted">{r.eventTitle || 'Event'}</span>,
    },
    {
      id: 'phone',
      header: 'Phone',
      cell: (r) => <span className="nums text-ink-muted">{r.phoneSnapshot || '—'}</span>,
    },
    {
      id: 'region',
      header: 'Region',
      sortValue: (r) => r.regionSnapshot || '',
      cell: (r) => <span className="text-ink-muted">{r.regionSnapshot || '—'}</span>,
    },
    {
      id: 'programme',
      header: 'Programme',
      sortValue: (r) => r.programmeSnapshot || '',
      cell: (r) => (
        <div className="min-w-0">
          <div className="text-ink truncate">{r.programmeSnapshot || '—'}</div>
          <div className="text-micro text-ink-faint">{r.levelSnapshot}</div>
        </div>
      ),
    },
    {
      id: 'submission',
      header: 'Submission',
      cell: (r) =>
        r.submissionContent ? (
          isUrl(r.submissionContent) ? (
            <a
              href={r.submissionContent}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title={r.submissionContent}
              className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
            >
              Link
              <ExternalLink className="w-3 h-3" aria-hidden />
            </a>
          ) : (
            <span
              className="text-ink-muted truncate block max-w-[10rem]"
              title={r.submissionContent}
            >
              {r.submissionContent}
            </span>
          )
        ) : (
          <span className="text-ink-faint">—</span>
        ),
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (r) => r.status,
      cell: (r) => (
        <Badge tone={r.status === 'CONFIRMED' ? 'live' : 'danger'} size="sm">
          {r.status}
        </Badge>
      ),
    },
  ];

  const selectClass = 'ed-select ed-field-sm';
  const labelClass = 'block text-micro font-semibold text-ink-muted mb-1.5';

  return (
    <div className="space-y-5">
      {/* ─── Controls ─── */}
      <Card elevation={1} className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none"
              aria-hidden
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, phone or event…"
              aria-label="Search registrations"
              className="ed-field pl-11 pr-10"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-ink-faint hover:text-ink hover:bg-surface-sunken transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasActiveFilters && (
              <Button variant="ghost" size="md" onClick={resetFilters}>
                Reset
              </Button>
            )}
            <CSVExportButton
              registrations={filteredData}
              filename="filtered_registrations.csv"
              variant="secondary"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-hairline space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="ed-eyebrow-plain inline-flex items-center gap-2 text-ink-faint">
              <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden />
              Filters
            </span>
            <span className="text-micro text-ink-faint nums">
              {filteredData.length} of {registrations.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
            <div>
              <label htmlFor="f-festival" className={labelClass}>
                Festival
              </label>
              <select
                id="f-festival"
                value={selectedMainEventId}
                onChange={(e) => {
                  setSelectedMainEventId(e.target.value);
                  setSelectedEventId('ALL');
                }}
                className={selectClass}
              >
                <option value="ALL">All festivals</option>
                {mainEvents.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="f-event" className={labelClass}>
                Event
              </label>
              <select
                id="f-event"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                disabled={selectedMainEventId === 'ALL'}
                className={cn(selectClass, 'disabled:opacity-50 disabled:cursor-not-allowed')}
              >
                <option value="ALL">All events</option>
                {events
                  .filter(
                    (e) => selectedMainEventId === 'ALL' || e.mainEventId === selectedMainEventId,
                  )
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label htmlFor="f-region" className={labelClass}>
                Region
              </label>
              <select
                id="f-region"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className={selectClass}
              >
                <option value="ALL">All regions</option>
                {[
                  'Bengaluru',
                  'Chandigarh',
                  'Chennai',
                  'Delhi',
                  'Hyderabad',
                  'Kolkata',
                  'Lucknow',
                  'Mumbai',
                  'Patna',
                ].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="f-level" className={labelClass}>
                Level
              </label>
              <select
                id="f-level"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className={selectClass}
              >
                <option value="ALL">All levels</option>
                {['Foundation', 'Diploma', 'Degree'].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 xl:col-span-1">
              <label htmlFor="f-programme" className={labelClass}>
                Programme
              </label>
              <select
                id="f-programme"
                value={selectedProgramme}
                onChange={(e) => setSelectedProgramme(e.target.value)}
                className={selectClass}
              >
                <option value="ALL">All programmes</option>
                {[
                  'Data Science & Applications',
                  'Diploma in Programming',
                  'Diploma in Data Science',
                  'Electronic Systems',
                  'Management and Data Science',
                  'Aeronautics and Space Technology',
                ].map((pr) => (
                  <option key={pr} value={pr}>
                    {pr}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      <p className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-signal-warn/10 border border-signal-warn/25 text-caption text-signal-warn">
        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
        Admin accounts cannot edit or delete student registrations — historical event records stay
        intact.
      </p>

      {/* ─── Bulk Action Bar ─── */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-brand-soft/60 border border-brand/25 dark:bg-brand/15 dark:border-brand/35 shadow-sm">
          <div className="flex items-center gap-2.5 text-caption font-semibold text-brand dark:text-[rgb(var(--brand))]">
            <span className="w-6 h-6 rounded-full bg-brand text-brand-contrast dark:bg-[rgb(var(--brand))] dark:text-stage text-caption inline-grid place-items-center font-bold">
              {selectedIds.size}
            </span>
            <span>Selected of {filteredData.length} entries</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopySelectedEmails}
              leftIcon={<Copy className="w-3.5 h-3.5" />}
            >
              Copy Emails
            </Button>
            <CSVExportButton
              registrations={filteredData.filter((r) => selectedIds.has(r.id))}
              filename="selected_registrations.csv"
              variant="secondary"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={filteredData}
        rowKey={(r) => r.id}
        caption="Student registrations"
        onRowClick={setSelectedRegistration}
        actions={(r) => (
          <Button
            size="icon"
            variant="ghost"
            aria-label={`View details for ${r.nameSnapshot}`}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedRegistration(r);
            }}
            className="w-9 h-9"
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}
        empty={
          <EmptyState
            icon={<SearchX />}
            title="No matching registrations"
            description={
              hasActiveFilters
                ? 'Try widening your search or resetting the filters.'
                : 'Registrations will appear here as students sign up.'
            }
            action={
              hasActiveFilters && (
                <Button variant="secondary" onClick={resetFilters}>
                  Reset filters
                </Button>
              )
            }
          />
        }
      />

      {/* ─── Detail modal ─── */}
      {selectedRegistration && (
        <Modal
          isOpen={!!selectedRegistration}
          onClose={() => setSelectedRegistration(null)}
          eyebrow="Registration"
          title={selectedRegistration.nameSnapshot}
          subtitle={selectedRegistration.emailSnapshot}
          maxWidth="lg"
        >
          <div className="space-y-5">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Phone', value: selectedRegistration.phoneSnapshot || 'Not provided' },
                { label: 'Region', value: selectedRegistration.regionSnapshot || '—' },
                { label: 'Level', value: selectedRegistration.levelSnapshot || '—' },
                { label: 'Programme', value: selectedRegistration.programmeSnapshot || '—' },
                { label: 'Event', value: selectedRegistration.eventTitle || '—' },
                { label: 'Type', value: selectedRegistration.registrationType },
                {
                  label: 'Registered',
                  value: new Date(selectedRegistration.createdAt).toLocaleString(),
                },
                { label: 'Reference', value: selectedRegistration.id, mono: true },
              ].map((row) => (
                <div key={row.label}>
                  <dt className="text-eyebrow uppercase font-display text-ink-faint">
                    {row.label}
                  </dt>
                  <dd
                    className={cn(
                      'text-caption text-ink font-medium mt-1 break-words',
                      row.mono && 'font-mono text-micro',
                    )}
                  >
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>

            {selectedRegistration.submissionContent && (
              <div className="p-4 rounded-xl bg-surface-sunken border border-hairline space-y-2">
                <p className="ed-eyebrow-plain text-ink-faint">Submission</p>
                {isUrl(selectedRegistration.submissionContent) ? (
                  <a
                    href={selectedRegistration.submissionContent}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-start gap-1.5 text-caption font-semibold text-brand hover:underline break-all"
                  >
                    <span className="min-w-0">{selectedRegistration.submissionContent}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden />
                  </a>
                ) : (
                  <p className="p-3 rounded-lg bg-surface-raised border border-hairline text-micro font-mono text-ink-muted whitespace-pre-wrap">
                    {selectedRegistration.submissionContent}
                  </p>
                )}
                {selectedRegistration.submittedAt && (
                  <p className="text-micro text-ink-faint">
                    Submitted {new Date(selectedRegistration.submittedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
