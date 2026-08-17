'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Registration } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { RhinoMascot } from '@/components/branding/RhinoMascot';
import { Ticket, ArrowRight, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MyRegistrationsPage() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyRegs = async () => {
    if (!user) return;
    setLoading(true);

    if (isMockMode) {
      setRegistrations(mockStore.getRegistrationsForUser(user.uid));
      setLoading(false);
    } else {
      try {
        const q = query(collection(db, 'registrations'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const items: Registration[] = [];
        snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() } as Registration));
        setRegistrations(items);
      } catch (err) {
        console.error('Error fetching registrations:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchMyRegs();
  }, [user]);

  const handleCancelRegistration = async (registrationId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to cancel your registration for this event?')) return;

    if (isMockMode) {
      mockStore.cancelRegistration(registrationId, user.uid);
      fetchMyRegs();
    } else {
      try {
        const docRef = doc(db, 'registrations', registrationId);
        await updateDoc(docRef, { status: 'CANCELLED', updatedAt: new Date().toISOString() });
        fetchMyRegs();
      } catch (err) {
        console.error('Cancel registration error:', err);
        alert('Failed to cancel registration');
      }
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-black text-kaziranga-800 dark:text-cream-100 flex items-center gap-2">
          <Ticket className="w-6 h-6 text-kaziranga-600 dark:text-kaziranga-400" />
          <span>My Registrations</span>
        </h1>
        <p className="text-xs text-kaziranga-600 dark:text-cream-400/60 mt-1">
          Your confirmed challenges, participation history, and registration status.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <RhinoMascot pose="thinking" size="sm" />
          <p className="text-xs text-kaziranga-500 dark:text-cream-400/50 mt-2">Loading registrations...</p>
        </div>
      ) : registrations.length === 0 ? (
        <Card className="p-12 text-center space-y-4">
          <RhinoMascot pose="welcome" size="md" />
          <div>
            <h3 className="text-base font-display font-bold text-kaziranga-800 dark:text-cream-100">
              No Challenges Accepted Yet
            </h3>
            <p className="text-xs text-kaziranga-500 dark:text-cream-400/50 max-w-sm mx-auto mt-1">
              You haven't registered for any Kaziranga House events yet. Explore the arena to get started!
            </p>
          </div>
          <Link href="/events" className="inline-block">
            <Button variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Enter the Arena
            </Button>
          </Link>
        </Card>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {registrations.map((reg) => {
            const isConfirmed = reg.status === 'CONFIRMED';
            return (
              <motion.div
                key={reg.id}
                variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              >
                <Card className="p-5 space-y-4" accent={isConfirmed ? 'teal' : 'none'}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-display font-bold text-kaziranga-800 dark:text-cream-100">
                        {reg.eventTitle || 'Event'}
                      </h3>
                      <p className="text-xs text-kaziranga-500 dark:text-cream-400/50 mt-0.5">
                        ID: <span className="font-mono">{reg.id.slice(0, 12)}...</span>
                      </p>
                    </div>
                    <Badge variant={isConfirmed ? 'emerald' : 'rose'} size="md">
                      {reg.status}
                    </Badge>
                  </div>

                  <div className="p-3 rounded-xl bg-cream-200/50 dark:bg-kaziranga-800/40 text-xs text-kaziranga-700 dark:text-cream-400/70 grid grid-cols-2 gap-2 border border-cream-400/15 dark:border-kaziranga-700/30">
                    <div>
                      <span className="font-semibold text-kaziranga-800 dark:text-cream-200">Student: </span>
                      {reg.nameSnapshot}
                    </div>
                    <div>
                      <span className="font-semibold text-kaziranga-800 dark:text-cream-200">Phone: </span>
                      {reg.phoneSnapshot || 'N/A'}
                    </div>
                    <div>
                      <span className="font-semibold text-kaziranga-800 dark:text-cream-200">Region: </span>
                      {reg.regionSnapshot}
                    </div>
                    <div>
                      <span className="font-semibold text-kaziranga-800 dark:text-cream-200">Programme: </span>
                      {reg.programmeSnapshot}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <Link href={`/events/${reg.eventId}`}>
                      <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                        View Event
                      </Button>
                    </Link>

                    {isConfirmed && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelRegistration(reg.id)}
                        leftIcon={<XCircle className="w-3.5 h-3.5 text-rhino-red" />}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
