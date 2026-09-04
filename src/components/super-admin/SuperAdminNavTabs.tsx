'use client';

import React from 'react';
import { Shield, FileSpreadsheet, Users, History, FolderArchive } from 'lucide-react';
import { NavTabs } from '../layout/NavTabs';

export const SuperAdminNavTabs: React.FC = () => (
  <NavTabs
    id="super-admin"
    accent
    tabs={[
      { label: 'Overview', href: '/super-admin/dashboard', icon: Shield },
      { label: 'Allowed Users', href: '/super-admin/allowed-users', icon: FileSpreadsheet },
      { label: 'Members', href: '/super-admin/roles', icon: Users },
      { label: 'Archived', href: '/super-admin/archived-users', icon: FolderArchive },
      { label: 'Audit Logs', href: '/super-admin/audit-logs', icon: History },
    ]}
  />
);
