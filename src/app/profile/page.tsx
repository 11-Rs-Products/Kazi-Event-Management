'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { userProfileSchema } from '@/lib/validation/schemas';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { User, Lock, Phone, MapPin, GraduationCap, BookOpen, Crown, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();

  const [phone, setPhone] = useState(user?.phone || '');
  const [region, setRegion] = useState(user?.region || 'East');
  const [level, setLevel] = useState(user?.level || 'Diploma');
  const [programme, setProgramme] = useState(user?.programme || 'BS Data Science');

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const validated = userProfileSchema.parse({
        phone,
        region,
        level,
        programme,
      });

      await updateProfile(validated);
      setSuccessMsg('Your profile information has been saved successfully!');
    } catch (err: any) {
      if (err.errors && err.errors[0]?.message) {
        setErrorMsg(err.errors[0].message);
      } else {
        setErrorMsg(err.message || 'Failed to update profile');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-kaziranga-950 dark:text-white flex items-center gap-2">
          <User className="w-6 h-6 text-kaziranga-600" />
          <span>Student Account Profile</span>
        </h1>
        <p className="text-xs text-kaziranga-600 dark:text-kaziranga-300 mt-1">
          Manage your personal details for seamless event registration.
        </p>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Account Info Box */}
      <Card className="p-6 space-y-6">
        {/* Read-Only Header */}
        <div className="flex items-center justify-between border-b border-kaziranga-100 dark:border-kaziranga-900 pb-4">
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-12 h-12 rounded-full ring-2 ring-kaziranga-600/30 object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-kaziranga-800 text-white font-black text-base flex items-center justify-center">
                {user.name.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-kaziranga-950 dark:text-white flex items-center gap-2">
                <span>{user.name}</span>
                <span title="Name provided by Google Auth">
                  <Lock className="w-3.5 h-3.5 text-kaziranga-400" />
                </span>
              </h2>
              <p className="text-xs text-kaziranga-500 font-mono">{user.email}</p>
            </div>
          </div>

          <div>
            {user.role === 'SUPER_ADMIN' ? (
              <Badge variant="gold" size="md">
                <Crown className="w-3.5 h-3.5 text-gold-500" />
                <span>Super Admin</span>
              </Badge>
            ) : user.role === 'ADMIN' ? (
              <Badge variant="blue" size="md">
                <Shield className="w-3.5 h-3.5 text-sky-500" />
                <span>Admin</span>
              </Badge>
            ) : (
              <Badge variant="emerald" size="md">
                <span>Kaziranga Student</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Editable Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-kaziranga-400">
            Editable Contact & Academic Information
          </h3>

          <div>
            <label className="block text-xs font-bold text-kaziranga-950 dark:text-white mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-kaziranga-500" />
              <span>Contact Phone Number</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-kaziranga-50/50 dark:bg-kaziranga-900/40 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white placeholder-kaziranga-400 focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-kaziranga-950 dark:text-white mb-1">
                Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-kaziranga-50/50 dark:bg-kaziranga-900/40 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
              >
                <option value="East">East</option>
                <option value="West">West</option>
                <option value="North">North</option>
                <option value="South">South</option>
                <option value="Central">Central</option>
                <option value="International">International</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-kaziranga-950 dark:text-white mb-1">
                Academic Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-kaziranga-50/50 dark:bg-kaziranga-900/40 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
              >
                <option value="Foundation">Foundation</option>
                <option value="Diploma">Diploma</option>
                <option value="Degree">Degree</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-kaziranga-950 dark:text-white mb-1">
                Programme
              </label>
              <select
                value={programme}
                onChange={(e) => setProgramme(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-kaziranga-50/50 dark:bg-kaziranga-900/40 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
              >
                <option value="BS Data Science">BS Data Science</option>
                <option value="BS Electronic Systems">BS Electronic Systems</option>
                <option value="Programming Diploma">Programming Diploma</option>
                <option value="Data Science Diploma">Data Science Diploma</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end">
            <Button type="submit" variant="primary" isLoading={isSaving}>
              Save Profile
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
