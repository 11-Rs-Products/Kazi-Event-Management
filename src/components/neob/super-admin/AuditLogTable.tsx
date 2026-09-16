'use client';

import React, { useState } from 'react';
import { AuditLog } from '@/types';
import { ShieldCheck, UserCheck, FileSpreadsheet, FileSearch, Shield } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { DataTable, type Column } from '../ui/DataTable';
import { SearchInput } from '../ui/SearchInput';
import { FilterSelect } from '../ui/FilterSelect';
import { FilterToolbar } from '../ui/FilterToolbar';

interface AuditLogTableProps {
  logs: AuditLog[];
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({ logs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'ALL') {
      const act = log.action.toUpperCase();
      if (actionFilter === 'ROLE' && !act.includes('ROLE')) return false;
      if (
        actionFilter === 'WHITELIST' &&
        !act.includes('ALLOWED') &&
        !act.includes('WHITELIST') &&
        !act.includes('ACCESS')
      )
        return false;
      if (actionFilter === 'EVENT' && !act.includes('EVENT')) return false;
    }

    return (
      searchQuery === '' ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const formatActionTitle = (action: string): string => {
    const clean = (action || '').trim().toUpperCase();
    if (
      clean === 'ROLE_CHANGED' ||
      clean === 'USER_ROLE_CHANGED' ||
      clean === 'ROLE_PROMOTED' ||
      clean === 'ROLE_DEMOTED'
    ) {
      return 'Role Updated';
    }
    if (clean === 'ALLOWED_USERS_IMPORTED' || clean === 'WHITELIST_IMPORTED') {
      return 'Whitelist Imported';
    }
    if (clean === 'ALLOWED_USERS_EXPORTED' || clean === 'WHITELIST_EXPORTED') {
      return 'Whitelist Exported';
    }
    if (clean === 'USER_ARCHIVED' || clean === 'USER_REVOKED' || clean === 'ACCESS_REVOKED') {
      return 'Access Revoked';
    }
    if (clean === 'USER_RESTORED' || clean === 'ACCESS_RESTORED') {
      return 'Access Restored';
    }
    if (clean === 'TENURE_CREATED') {
      return 'Tenure Created';
    }
    if (clean === 'TENURE_ACTIVATED') {
      return 'Tenure Activated';
    }
    if (clean === 'SYSTEM_BOOTSTRAP') {
      return 'System Initialized';
    }
    if (clean.startsWith('EVENT_')) {
      return clean
        .replace('EVENT_', 'Event ')
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }
    return (action || '')
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getActionBadge = (action: string) => {
    const title = formatActionTitle(action);
    const upper = (action || '').toUpperCase();

    if (upper.includes('ROLE')) {
      return (
        <Badge tone="accent" size="sm">
          <UserCheck className="w-3 h-3" aria-hidden />
          {title}
        </Badge>
      );
    }
    if (upper.includes('ALLOWED') || upper.includes('WHITELIST')) {
      return (
        <Badge tone="info" size="sm">
          <FileSpreadsheet className="w-3 h-3" aria-hidden />
          {title}
        </Badge>
      );
    }
    if (upper.includes('EVENT')) {
      return (
        <Badge tone="live" size="sm">
          <ShieldCheck className="w-3 h-3" aria-hidden />
          {title}
        </Badge>
      );
    }
    return (
      <Badge tone="neutral" size="sm">
        {title}
      </Badge>
    );
  };

  const formatActorDisplay = (actorEmail: string) => {
    if (
      !actorEmail ||
      actorEmail.toLowerCase().includes('verified by firestore') ||
      actorEmail.toLowerCase() === 'system'
    ) {
      return <span className="text-ink-muted font-sans text-caption">Super Admin</span>;
    }
    return <span className="font-mono text-caption text-ink font-medium">{actorEmail}</span>;
  };

  const columns: Column<AuditLog>[] = [
    {
      id: 'action',
      header: 'Action',
      primary: true,
      sortValue: (l) => formatActionTitle(l.action),
      cell: (l) => getActionBadge(l.action),
    },
    {
      id: 'timestamp',
      header: 'When',
      sortValue: (l) => new Date(l.timestamp).getTime(),
      cell: (l) => (
        <time className="font-mono text-micro text-ink-faint whitespace-nowrap">
          {new Date(l.timestamp).toLocaleString()}
        </time>
      ),
    },
    {
      id: 'actor',
      header: 'Actor',
      sortValue: (l) => l.actorEmail,
      cell: (l) => formatActorDisplay(l.actorEmail),
    },
    {
      id: 'target',
      header: 'Target',
      sortValue: (l) => l.target,
      cell: (l) => <span className="text-ink-muted break-words">{l.target}</span>,
    },
    {
      id: 'metadata',
      header: 'Payload',
      hideOnMobile: true,
      cell: (l) =>
        l.metadata ? (
          <pre className="max-h-20 max-w-xs overflow-auto rounded-lg bg-surface-sunken p-2 border border-hairline font-mono text-micro text-ink-muted">
            {JSON.stringify(l.metadata, null, 2)}
          </pre>
        ) : (
          <span className="text-ink-faint">—</span>
        ),
    },
  ];

  const hasActiveFilters = actionFilter !== 'ALL' || Boolean(searchQuery.trim());

  return (
    <div className="space-y-4">
      <FilterToolbar
        variant="bare"
        totalCount={logs.length}
        filteredCount={filteredLogs.length}
        filterTitle="Filter audit log"
        filterCount={actionFilter !== 'ALL' ? 1 : 0}
        hasActiveFilters={hasActiveFilters}
        onReset={() => {
          setActionFilter('ALL');
          setSearchQuery('');
        }}
        search={
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by action, actor or target…"
            aria-label="Search audit logs"
          />
        }
        filters={
          <div className="space-y-2">
            <label className="block text-micro font-display font-bold uppercase tracking-wider text-ink-muted">
              Action Category
            </label>
            <FilterSelect
              value={actionFilter}
              onChange={setActionFilter}
              options={[
                { value: 'ALL', label: 'All Action Types' },
                { value: 'ROLE', label: 'Role Changes' },
                { value: 'WHITELIST', label: 'Whitelist & Access' },
                { value: 'EVENT', label: 'Event Operations' },
              ]}
              icon={<Shield />}
              ariaLabel="Filter audit logs by action category"
              containerClassName="w-full"
            />
          </div>
        }
      />

      <DataTable
        columns={columns}
        rows={filteredLogs}
        rowKey={(l) => l.id}
        caption="Security audit log"
        empty={
          <EmptyState
            icon={<FileSearch />}
            title="No audit entries"
            description={
              searchQuery
                ? 'No entries match that search.'
                : 'Privileged actions are recorded here as they happen.'
            }
          />
        }
      />
    </div>
  );
};
