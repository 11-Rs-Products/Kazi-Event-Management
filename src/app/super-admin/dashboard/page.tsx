'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AllowedUser, AuditLog, UserProfile } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { collection, getDocs } from 'firebase/firestore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Stat } from '@/components/ui/Stat';
import { SectionHeading } from '@/components/ui/Section';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Stagger, StaggerItem, Reveal } from '@/components/ui/Motion';
import { SuperAdminNavTabs } from '@/components/super-admin/SuperAdminNavTabs';
import { TenureManager } from '@/components/super-admin/TenureManager';
import { FileSpreadsheet, Users, History, ShieldCheck, Crown, ArrowUpRight } from 'lucide-react';

export default function SuperAdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [allowedUsers, setAllowedUsers] = useState<AllowedUser[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.replace('/dashboard');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      if (isMockMode) {
        setAllowedUsers(mockStore.getAllowedUsers());
        setAllUsers(mockStore.getUsers());
        setAuditLogs(mockStore.getAuditLogs());
        setLoading(false);
      } else {
        try {
          const allowedSnap = await getDocs(collection(db, 'allowedUsers'));
          const allowedList: AllowedUser[] = [];
          allowedSnap.forEach((d) => allowedList.push({ email: d.id, ...d.data() } as AllowedUser));

          const usersSnap = await getDocs(collection(db, 'users'));
          const usersList: UserProfile[] = [];
          usersSnap.forEach((d) => usersList.push({ uid: d.id, ...d.data() } as UserProfile));

          const logsSnap = await getDocs(collection(db, 'auditLogs'));
          const logsList: AuditLog[] = [];
          logsSnap.forEach((d) => logsList.push({ id: d.id, ...d.data() } as AuditLog));

          setAllowedUsers(allowedList);
          setAllUsers(usersList);
          setAuditLogs(logsList);
        } catch (err) {
          console.error('Error fetching super admin data:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [user, router]);

  if (!user || user.role !== 'SUPER_ADMIN') return null;

  const adminUsers = allUsers.filter((u) => u.role === 'ADMIN');
  const superAdminUsers = allUsers.filter((u) => u.role === 'SUPER_ADMIN');

  const metrics = [
    {
      icon: <ShieldCheck />,
      label: 'Allowed registry',
      value: allowedUsers.length,
      meta: 'Active access list',
      tone: 'brand' as const,
    },
    {
      icon: <Users />,
      label: 'Admins',
      value: adminUsers.length,
      meta: 'ADMIN accounts',
      tone: 'default' as const,
    },
    {
      icon: <Crown />,
      label: 'Super admins',
      value: superAdminUsers.length,
      meta: 'SUPER_ADMIN accounts',
      tone: 'accent' as const,
    },
    {
      icon: <History />,
      label: 'Audit entries',
      value: auditLogs.length,
      meta: 'Recorded actions',
      tone: 'default' as const,
    },
  ];

  return (
    <div>
      <SuperAdminNavTabs />

      <div className="space-y-8">
        <SectionHeading
          eyebrow="Super admin"
          title="Command centre"
          description="Academic tenures, the allowed-user registry, administrator roles and the security audit trail."
          size="lg"
          as="h1"
          actions={
            <>
              <Link href="/super-admin/allowed-users">
                <Button variant="accent" leftIcon={<FileSpreadsheet className="w-4 h-4" />}>
                  Import registry
                </Button>
              </Link>
              <Link href="/super-admin/roles">
                <Button variant="secondary" leftIcon={<Users className="w-4 h-4" />}>
                  Members
                </Button>
              </Link>
            </>
          }
        />

        <Stagger className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <StaggerItem key={m.label}>
              <Stat
                icon={m.icon}
                tone={m.tone}
                label={m.label}
                value={<AnimatedNumber value={m.value} />}
                meta={m.meta}
              />
            </StaggerItem>
          ))}
        </Stagger>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          <TenureManager />

          {/* ─── Allowed registry preview ─── */}
          <Reveal delay={0.08} className="space-y-4">
            <SectionHeading
              title="Allowed registry"
              size="sm"
              actions={
                <Link
                  href="/super-admin/allowed-users"
                  className="inline-flex items-center gap-1 text-caption font-display font-bold text-ink-muted hover:text-brand transition-colors"
                >
                  Manage
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden />
                </Link>
              }
            />

            <Card elevation={1}>
              {allowedUsers.length === 0 ? (
                <p className="px-5 py-10 text-center text-caption text-ink-muted">
                  No emails on the allowed list yet.
                </p>
              ) : (
                <ul className="max-h-80 overflow-y-auto divide-y divide-hairline">
                  {allowedUsers.slice(0, 12).map((u, i) => (
                    <li
                      key={`${u.email}-${i}`}
                      className="px-4 py-2.5 flex items-center justify-between gap-3"
                    >
                      <span className="font-mono text-micro text-ink-muted truncate">
                        {u.email}
                      </span>
                      <Badge tone="live" size="sm">
                        Allowed
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </Reveal>

          {/* ─── Audit stream ─── */}
          <Reveal delay={0.16} className="space-y-4">
            <SectionHeading
              title="Recent activity"
              size="sm"
              actions={
                <Link
                  href="/super-admin/audit-logs"
                  className="inline-flex items-center gap-1 text-caption font-display font-bold text-ink-muted hover:text-brand transition-colors"
                >
                  All
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden />
                </Link>
              }
            />

            <Card elevation={1}>
              {auditLogs.length === 0 ? (
                <p className="px-5 py-10 text-center text-caption text-ink-muted">
                  No privileged actions recorded yet.
                </p>
              ) : (
                <ul className="divide-y divide-hairline">
                  {auditLogs.slice(0, 6).map((log) => (
                    <li key={log.id} className="px-4 py-3 space-y-1">
                      <p className="font-display font-bold text-caption text-ink">
                        {log.action.replace(/_/g, ' ')}
                      </p>
                      <p className="text-micro text-ink-muted font-mono truncate">
                        {log.actorEmail}
                      </p>
                      <time className="block text-micro text-ink-faint nums">
                        {new Date(log.timestamp).toLocaleString()}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
