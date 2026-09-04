'use client';

import React from 'react';
import { LayoutDashboard, Calendar, Ticket } from 'lucide-react';
import { NavTabs } from '../layout/NavTabs';

export const AdminNavTabs: React.FC = () => (
  <NavTabs
    id="admin"
    tabs={[
      { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Events', href: '/admin/events', icon: Calendar },
      { label: 'Registrations', href: '/admin/registrations', icon: Ticket },
    ]}
  />
);
