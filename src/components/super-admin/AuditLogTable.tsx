import React, { useState } from 'react';
import { AuditLog } from '@/types';
import { History, Search, ShieldCheck, UserCheck, FileSpreadsheet, Lock } from 'lucide-react';
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
      <div className="p-4 rounded-2xl bg-white dark:bg-kaziranga-950 border border-kaziranga-100 dark:border-kaziranga-900 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-kaziranga-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit logs by action, actor email, or target..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-kaziranga-50/70 dark:bg-kaziranga-900/50 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white placeholder-kaziranga-400 focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
          />
        </div>
      </div>

      {/* Log Table */}
      <div className="rounded-2xl border border-kaziranga-100 dark:border-kaziranga-900 bg-white dark:bg-kaziranga-950 overflow-hidden shadow-sm">
        <div className="max-h-[700px] overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-kaziranga-50 dark:bg-kaziranga-900 z-10 shadow-sm">
              <tr className="bg-kaziranga-50/80 dark:bg-kaziranga-900/50 text-[11px] font-bold uppercase tracking-wider text-kaziranga-600 dark:text-kaziranga-400 border-b border-kaziranga-100 dark:border-kaziranga-900">
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Actor (Super Admin)</th>
                <th className="p-3.5">Target</th>
                <th className="p-3.5">Metadata Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kaziranga-100 dark:divide-kaziranga-900 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-kaziranga-500">
                    No security audit logs recorded.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-kaziranga-50/50 dark:hover:bg-kaziranga-900/30 transition-colors font-mono">
                    <td className="p-3.5 text-kaziranga-500 text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-sans font-bold">{getActionBadge(log.action)}</td>
                    <td className="p-3.5 font-sans font-medium text-kaziranga-900 dark:text-kaziranga-100">
                      {log.actorEmail}
                    </td>
                    <td className="p-3.5 font-sans text-kaziranga-700 dark:text-kaziranga-300">
                      {log.target}
                    </td>
                    <td className="p-3.5 text-[10px] text-kaziranga-500 max-w-xs truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
