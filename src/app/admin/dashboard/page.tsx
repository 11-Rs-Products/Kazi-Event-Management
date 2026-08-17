'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { EventItem, Registration } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { collection, getDocs } from 'firebase/firestore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AdminNavTabs } from '@/components/admin/AdminNavTabs';
import { CSVExportButton } from '@/components/admin/CSVExportButton';
import { Shield, Calendar, Ticket, PlusCircle, ArrowRight, Users, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'USER') {
      router.replace('/dashboard');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      if (isMockMode) {
        setEvents(mockStore.getEvents());
        setRegistrations(mockStore.getRegistrations());
        setLoading(false);
      } else {
        try {
          const evSnap = await getDocs(collection(db, 'events'));
          const evs: EventItem[] = [];
          evSnap.forEach((d) => evs.push({ id: d.id, ...d.data() } as EventItem));

          const regSnap = await getDocs(collection(db, 'registrations'));
          const regs: Registration[] = [];
          regSnap.forEach((d) => regs.push({ id: d.id, ...d.data() } as Registration));

          setEvents(evs);
          setRegistrations(regs);
        } catch (err) {
          console.error('Admin dashboard fetch error:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [user, router]);

  if (!user || user.role === 'USER') return null;

  const publishedEvents = events.filter((e) => e.status === 'PUBLISHED');
  const confirmedRegistrations = registrations.filter((r) => r.status === 'CONFIRMED');

  return (
    <div className="space-y-6">
      {/* Admin Nav Tabs for Mobile & Desktop */}
      <AdminNavTabs />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-black text-kaziranga-800 dark:text-cream-100 flex items-center gap-2">
            <Zap className="w-6 h-6 text-kaziranga-600 dark:text-kaziranga-400" />
            <span>Admin Control Center</span>
          </h1>
          <p className="text-xs text-kaziranga-600 dark:text-cream-400/60 mt-1">
            Manage event lifecycles, view participant data, and generate export reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <CSVExportButton registrations={confirmedRegistrations} filename="all_kaziranga_registrations.csv" />
          <Link href="/admin/events/new">
            <Button variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Create Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        {[
          { label: 'Total Events', value: events.length, sub: 'Drafts & Published', color: 'text-kaziranga-800 dark:text-cream-100' },
          { label: 'Active Published', value: publishedEvents.length, sub: 'Open for Registration', color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Total Registrations', value: confirmedRegistrations.length, sub: 'Confirmed Students', color: 'text-sky-600 dark:text-sky-400' },
          { label: 'Admin Status', value: user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin', sub: 'Authenticated', color: 'text-gold-600 dark:text-gold-400', isText: true },
        ].map((metric, i) => (
          <motion.div key={i} variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
            <Card className="p-4 space-y-1">
              <div className="text-[10px] text-kaziranga-500 dark:text-cream-400/50 font-bold uppercase tracking-wider font-display">{metric.label}</div>
              <div className={`${(metric as any).isText ? 'text-sm' : 'text-2xl'} font-display font-black ${metric.color}`}>
                {metric.value}
              </div>
              <div className="text-[10px] text-kaziranga-500 dark:text-cream-400/40">{metric.sub}</div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Events Table (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-bold text-kaziranga-800 dark:text-cream-100">Event Management</h3>
            <Link href="/admin/events" className="text-xs font-bold text-kaziranga-700 dark:text-cream-300 hover:underline">
              Manage All
            </Link>
          </div>

          <Card className="overflow-hidden shadow-arena">
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="arena-table">
                <thead>
                  <tr>
                    <th>Event Name</th>
                    <th>Status</th>
                    <th>Deadline</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.slice(0, 5).map((evt) => (
                    <tr key={evt.id}>
                      <td className="font-display font-bold text-kaziranga-800 dark:text-cream-100">{evt.name}</td>
                      <td>
                        <Badge variant={evt.status === 'PUBLISHED' ? 'emerald' : 'amber'} size="sm">
                          {evt.status}
                        </Badge>
                      </td>
                      <td className="font-mono text-xs text-kaziranga-600 dark:text-cream-400/60">
                        {new Date(evt.registrationDeadline).toLocaleDateString()}
                      </td>
                      <td className="text-right">
                        <Link href={`/admin/events/${evt.id}/edit`}>
                          <Button size="sm" variant="ghost">Edit</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden divide-y divide-cream-400/20 dark:divide-kaziranga-800/60">
              {events.slice(0, 5).map((evt) => (
                <div key={evt.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-display font-bold text-sm text-kaziranga-800 dark:text-cream-100">
                      {evt.name}
                    </h4>
                    <Badge variant={evt.status === 'PUBLISHED' ? 'emerald' : 'amber'} size="sm">
                      {evt.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-mono text-[11px] text-kaziranga-500 dark:text-cream-400/50">
                      Deadline: {new Date(evt.registrationDeadline).toLocaleDateString()}
                    </span>
                    <Link href={`/admin/events/${evt.id}/edit`}>
                      <Button size="sm" variant="outline">Edit</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Registrations (1 Col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-bold text-kaziranga-800 dark:text-cream-100">Recent Registrations</h3>
            <Link href="/admin/registrations" className="text-xs font-bold text-kaziranga-700 dark:text-cream-300 hover:underline">
              View Table
            </Link>
          </div>

          <Card className="p-4 divide-y divide-cream-400/15 dark:divide-kaziranga-800/40 shadow-arena">
            {confirmedRegistrations.slice(0, 5).map((reg) => (
              <div key={reg.id} className="py-2.5 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-kaziranga-800 dark:text-cream-100">{reg.nameSnapshot}</span>
                  <span className="text-[10px] text-kaziranga-500 dark:text-cream-400/40">{new Date(reg.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="text-[11px] text-kaziranga-600 dark:text-cream-400/60 truncate">
                  {reg.eventTitle}
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
