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
import { Ticket, Calendar, MapPin, XCircle, ArrowRight, ShieldCheck } from 'lucide-react';

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
        <h1 className="text-2xl font-black text-kaziranga-950 dark:text-white flex items-center gap-2">
          <Ticket className="w-6 h-6 text-kaziranga-600" />
          <span>My Event Registrations</span>
        </h1>
        <p className="text-xs text-kaziranga-600 dark:text-kaziranga-300 mt-1">
          View your confirmed event registrations, participation history, and status.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-kaziranga-500">
          Loading your registrations...
        </div>
      ) : registrations.length === 0 ? (
        <Card className="p-12 text-center space-y-4">
          <Ticket className="w-12 h-12 text-kaziranga-300 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-kaziranga-950 dark:text-white">
              No Event Registrations Found
            </h3>
            <p className="text-xs text-kaziranga-500 max-w-sm mx-auto mt-1">
              You have not registered for any Kaziranga House events yet. Explore open competitions to get started!
            </p>
          </div>
          <Link href="/events" className="inline-block">
            <Button variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Explore Events
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {registrations.map((reg) => {
            const isConfirmed = reg.status === 'CONFIRMED';
            return (
              <Card key={reg.id} className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-kaziranga-950 dark:text-white">
                      {reg.eventTitle || 'Event'}
                    </h3>
                    <p className="text-xs text-kaziranga-500 mt-0.5">
                      Registration ID: <span className="font-mono">{reg.id}</span>
                    </p>
                  </div>
                  <Badge variant={isConfirmed ? 'emerald' : 'rose'} size="md">
                    {reg.status}
                  </Badge>
                </div>

                {/* Participant Details Snapshot */}
                <div className="p-3 rounded-xl bg-kaziranga-50/70 dark:bg-kaziranga-900/40 text-xs text-kaziranga-700 dark:text-kaziranga-300 grid grid-cols-2 gap-2 border border-kaziranga-100 dark:border-kaziranga-800">
                  <div>
                    <span className="font-semibold text-kaziranga-900 dark:text-white">Student: </span>
                    {reg.nameSnapshot}
                  </div>
                  <div>
                    <span className="font-semibold text-kaziranga-900 dark:text-white">Phone: </span>
                    {reg.phoneSnapshot || 'N/A'}
                  </div>
                  <div>
                    <span className="font-semibold text-kaziranga-900 dark:text-white">Region: </span>
                    {reg.regionSnapshot}
                  </div>
                  <div>
                    <span className="font-semibold text-kaziranga-900 dark:text-white">Programme: </span>
                    {reg.programmeSnapshot}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-between">
                  <Link href={`/events/${reg.eventId}`}>
                    <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      View Event Info
                    </Button>
                  </Link>

                  {isConfirmed && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelRegistration(reg.id)}
                      leftIcon={<XCircle className="w-3.5 h-3.5 text-rose-500" />}
                    >
                      Cancel Registration
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
