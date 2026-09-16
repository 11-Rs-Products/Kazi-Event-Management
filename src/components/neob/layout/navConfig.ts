import {
  LayoutDashboard,
  Calendar,
  CalendarCheck,
  ClipboardList,
  User,
  Bell,
  Users,
  Shield,
  FileSpreadsheet,
  History,
  FolderArchive,
  PlusCircle,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/types';

export const UI_PREFIX = '/new';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
  /** Optional shortcut rendered beside the section label. */
  action?: { label: string; href: string; icon: LucideIcon };
  /** Section is styled with the gold accent rather than the default. */
  accent?: boolean;
}

const studentSection: NavSection = {
  id: 'student',
  label: 'Student Portal',
  items: [
    { label: 'Dashboard', href: '/new/dashboard', icon: LayoutDashboard },
    { label: 'Events', href: '/new/events', icon: Calendar },
    { label: 'My Registrations', href: '/new/my-registrations', icon: CalendarCheck },
  ],
};

const adminSection: NavSection = {
  id: 'admin',
  label: 'Admin Suite',
  action: { label: 'Create new event', href: '/new/admin/events/new', icon: PlusCircle },
  items: [
    { label: 'Admin Dashboard', href: '/new/admin/dashboard', icon: LayoutDashboard },
    { label: 'Manage Events', href: '/new/admin/events', icon: Calendar },
    { label: 'All Registrations', href: '/new/admin/registrations', icon: ClipboardList },
  ],
};

const superAdminSection: NavSection = {
  id: 'super-admin',
  label: 'Super Admin',
  accent: true,
  items: [
    { label: 'Overview', href: '/new/super-admin/dashboard', icon: Shield },
    { label: 'Allowed Users', href: '/new/super-admin/allowed-users', icon: FileSpreadsheet },
    { label: 'Members Directory', href: '/new/super-admin/roles', icon: Users },
    { label: 'Archived Users', href: '/new/super-admin/archived-users', icon: FolderArchive },
    { label: 'Audit Logs', href: '/new/super-admin/audit-logs', icon: History },
  ],
};

const accountSection: NavSection = {
  id: 'account',
  label: 'Account',
  items: [
    { label: 'Profile', href: '/new/profile', icon: User },
    { label: 'Notifications', href: '/new/notifications', icon: Bell },
  ],
};

/**
 * The nav sections a given role may see, in display order.
 */
export function getNavSections(role?: UserRole): NavSection[] {
  const sections: NavSection[] = [studentSection];
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') sections.push(adminSection);
  if (role === 'SUPER_ADMIN') sections.push(superAdminSection);
  sections.push(accountSection);
  return sections;
}

export const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/kaziranga_iitm/',
    hover: 'hover:text-pink-400',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/kaziranga-iitm/posts/?feedView=all',
    hover: 'hover:text-sky-400',
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@KazirangaHouse',
    hover: 'hover:text-red-400',
  },
] as const;
