'use client';

import React, { useState } from 'react';
import { AuditLog } from '@/types';
import { History, Search, ShieldCheck, UserCheck, FileSpreadsheet, Lock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface AuditLogTableProps {
  logs: AuditLog[];
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({ logs }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter((log) => {
    return (
      searchQuery === '' ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getActionBadge = (action: string) => {
    if (action.includes('ROLE')) {
      return (
        <Badge variant="gold" size="sm">
          <UserCheck className="w-3 h-3 text-gold-500" />
          <span>{action}</span>
        </Badge>
      );
    }
    if (action.includes('ALLOWED')) {
      return (
        <Badge variant="purple" size="sm">
          <FileSpreadsheet className="w-3 h-3" />
          <span>{action}</span>
        </Badge>
      );
    }
    if (action.includes('EVENT')) {
      return (
        <Badge variant="emerald" size="sm">
          <ShieldCheck className="w-3 h-3" />
          <span>{action}</span>
        </Badge>
      );
    }
    return (
      <Badge variant="slate" size="sm">
        <span>{action}</span>
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <Card className="p-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-kaziranga-500 dark:text-cream-400/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit logs by action, actor email, or target..."
            className="arena-input pl-10"
          />
        </div>
      </Card>

      {/* Log Table / Mobile Cards */}
      <Card className="overflow-hidden shadow-arena">
        {/* Desktop Table View */}
        <div className="hidden md:block max-h-[700px] overflow-auto">
          <table className="arena-table">
            <thead className="sticky top-0 z-10 shadow-sm">
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Actor (Super Admin)</th>
                <th>Target</th>
                <th>Metadata Payload</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-kaziranga-500 dark:text-cream-400/50">
                    No security audit logs recorded.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="font-mono text-kaziranga-500 dark:text-cream-400/50 text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>{getActionBadge(log.action)}</td>
                    <td className="font-medium text-kaziranga-800 dark:text-cream-100 font-mono text-xs">
                      {log.actorEmail}
                    </td>
                    <td className="text-kaziranga-700 dark:text-cream-300 font-medium">
                      {log.target}
                    </td>
                    <td>
                      {log.metadata ? (
                        <div className="max-h-20 max-w-xs overflow-y-auto rounded-lg bg-cream-200/50 dark:bg-kaziranga-800/40 p-2 font-mono text-[11px] text-kaziranga-700 dark:text-cream-300/80 border border-cream-400/20 dark:border-kaziranga-700/40">
                          <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                        </div>
                      ) : (
                        <span className="text-kaziranga-400 dark:text-cream-400/40 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Timeline Cards */}
        <div className="md:hidden divide-y divide-cream-400/20 dark:divide-kaziranga-800/60 max-h-[700px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-kaziranga-500 dark:text-cream-400/50">
              No security audit logs recorded.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>{getActionBadge(log.action)}</div>
                  <span className="font-mono text-kaziranga-500 dark:text-cream-400/40 text-[10px]">
                    {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="text-kaziranga-800 dark:text-cream-100 font-medium break-all">
                    Target: <span className="font-semibold">{log.target}</span>
                  </div>
                  <div className="text-[11px] font-mono text-kaziranga-600 dark:text-cream-400/60">
                    By: {log.actorEmail}
                  </div>
                </div>

                {log.metadata && (
                  <div className="p-2 rounded-lg bg-cream-200/50 dark:bg-kaziranga-800/40 font-mono text-[10px] text-kaziranga-700 dark:text-cream-300/80 border border-cream-400/20 dark:border-kaziranga-700/40 max-h-24 overflow-y-auto">
                    <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
