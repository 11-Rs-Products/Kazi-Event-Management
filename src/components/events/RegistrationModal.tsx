'use client';

import React, { useState, useEffect } from 'react';
import { EventItem } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { registrationSchema } from '@/lib/validation/schemas';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { CheckCircle2, Lock, User, Phone, MapPin, GraduationCap, BookOpen, AlertCircle } from 'lucide-react';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

interface RegistrationModalProps {
  event: EventItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  event,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, updateProfile } = useAuth();

  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('');
  const [level, setLevel] = useState('');
  const [programme, setProgramme] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setPhone(user.phone || '');
      setRegion(user.region || 'East');
      setLevel(user.level || 'Diploma');
      setProgramme(user.programme || 'BS Data Science');
    }
  }, [user, isOpen]);

  if (!event || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate inputs
      const validated = registrationSchema.parse({
        eventId: event.id,
        phone,
        region,
        level,
        programme,
      });

      if (isMockMode) {
        mockStore.registerForEvent(event, user, {
          phone: validated.phone,
          region: validated.region,
          level: validated.level,
          programme: validated.programme,
        });
      } else {
        // Real Firestore Registration Transaction/Write
        const regId = 'reg_' + Date.now();
        const regDocRef = doc(db, 'registrations', regId);

        const newRegistration = {
          id: regId,
          eventId: event.id,
          eventTitle: event.name,
          userId: user.uid,
          nameSnapshot: user.name,
          emailSnapshot: user.email,
          phoneSnapshot: validated.phone,
          regionSnapshot: validated.region,
          levelSnapshot: validated.level,
          programmeSnapshot: validated.programme,
          registrationType: event.registrationType,
          status: 'CONFIRMED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await setDoc(regDocRef, newRegistration);

        // Update user profile automatically with new phone/region details
        await updateProfile({
          phone: validated.phone,
          region: validated.region,
          level: validated.level,
          programme: validated.programme,
        });
      }

      setLoading(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setLoading(false);
      if (err.errors && err.errors[0]?.message) {
        setError(err.errors[0].message);
      } else {
        setError(err.message || 'Failed to submit registration');
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Event Registration"
      subtitle={event.name}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Read-Only Google Info Notice */}
        <div className="p-3 rounded-xl bg-kaziranga-50 dark:bg-kaziranga-900/40 border border-kaziranga-100 dark:border-kaziranga-800 text-xs text-kaziranga-700 dark:text-kaziranga-300 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-kaziranga-950 dark:text-white">
            <Lock className="w-3.5 h-3.5 text-kaziranga-500" />
            <span>Authenticated Google Student Credentials</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-kaziranga-600 dark:text-kaziranga-300">
            <div>
              <span className="font-semibold text-kaziranga-800 dark:text-kaziranga-200">Name: </span>
              {user.name}
            </div>
            <div>
              <span className="font-semibold text-kaziranga-800 dark:text-kaziranga-200">Email: </span>
              {user.email}
            </div>
          </div>
        </div>

        {/* Editable Registration / Profile Details */}
        <div className="space-y-3 pt-2">
          {/* Phone Number Field */}
          <div>
            <label className="block text-xs font-bold text-kaziranga-950 dark:text-white mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-kaziranga-500" />
              <span>Contact Phone Number <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-kaziranga-50/50 dark:bg-kaziranga-900/40 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white placeholder-kaziranga-400 focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
            />
            <p className="text-[11px] text-kaziranga-500 dark:text-kaziranga-400 mt-1">
              This phone number will be automatically saved to your profile for future event registrations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Region */}
            <div>
              <label className="block text-xs font-bold text-kaziranga-950 dark:text-white mb-1">
                Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-kaziranga-50/50 dark:bg-kaziranga-900/40 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
              >
                <option value="East">East</option>
                <option value="West">West</option>
                <option value="North">North</option>
                <option value="South">South</option>
                <option value="Central">Central</option>
                <option value="International">International</option>
              </select>
            </div>

            {/* Level */}
            <div>
              <label className="block text-xs font-bold text-kaziranga-950 dark:text-white mb-1">
                Academic Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-kaziranga-50/50 dark:bg-kaziranga-900/40 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
              >
                <option value="Foundation">Foundation</option>
                <option value="Diploma">Diploma</option>
                <option value="Degree">Degree</option>
              </select>
            </div>

            {/* Programme */}
            <div>
              <label className="block text-xs font-bold text-kaziranga-950 dark:text-white mb-1">
                Programme
              </label>
              <select
                value={programme}
                onChange={(e) => setProgramme(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-kaziranga-50/50 dark:bg-kaziranga-900/40 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
              >
                <option value="BS Data Science">BS Data Science</option>
                <option value="BS Electronic Systems">BS Electronic Systems</option>
                <option value="Programming Diploma">Programming Diploma</option>
                <option value="Data Science Diploma">Data Science Diploma</option>
              </select>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-kaziranga-100 dark:border-kaziranga-900">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            Confirm Registration
          </Button>
        </div>
      </form>
    </Modal>
  );
};
