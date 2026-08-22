'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { userProfileSchema } from '@/lib/validation/schemas';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { User, Lock, Phone, MapPin, GraduationCap, BookOpen, Crown, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();

  const [phone, setPhone] = useState(user?.phone || '');
  const [region, setRegion] = useState(user?.region || '');
  const [level, setLevel] = useState(user?.level || '');
  const [programme, setProgramme] = useState(user?.programme || '');

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const availableRegions = useMemo(() => {
    const defaultList = [
      'Bengaluru',
      'Chandigarh',
      'Chennai',
      'Delhi',
      'Hyderabad',
      'Kolkata',
      'Lucknow',
      'Mumbai',
      'Patna',
    ];
    const list = [...defaultList];
    if (user?.region && !list.includes(user.region)) list.push(user.region);
    if (region && !list.includes(region)) list.push(region);
    return Array.from(new Set(list));
  }, [user?.region, region]);

  const availableLevels = useMemo(() => {
    const defaultList = ['Foundation', 'Diploma', 'Degree'];
    const list = [...defaultList];
    if (user?.level && !list.includes(user.level)) list.push(user.level);
    if (level && !list.includes(level)) list.push(level);
    return Array.from(new Set(list));
  }, [user?.level, level]);

  const availableProgrammes = useMemo(() => {
    const defaultList = [
      'Data Science & Applications',
      'Diploma in Programming',
      'Diploma in Data Science',
      'Electronic Systems',
      'Management and Data Science',
      'Aeronautics and Space Technology',
    ];
    const list = [...defaultList];
    if (user?.programme && !list.includes(user.programme)) list.push(user.programme);
    if (programme && !list.includes(programme)) list.push(programme);
    return Array.from(new Set(list));
  }, [user?.programme, programme]);

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
      setSuccessMsg('Your profile information has been updated successfully!');
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
        <h1 className="text-2xl font-display font-black text-kaziranga-800 dark:text-cream-100 flex items-center gap-2.5">
          <User className="w-7 h-7 text-kaziranga-700 dark:text-cream-200 shrink-0" />
          <span>Profile Information</span>
        </h1>
        <p className="text-xs text-kaziranga-600 dark:text-cream-400/60 mt-1">
          Manage your personal details for seamless event registration.
        </p>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rhino-red/5 dark:bg-rhino-red/10 border border-rhino-red/20 text-rhino-red dark:text-rhino-red-light text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile Card */}
      <Card className="overflow-hidden">
        {/* Teal Header with Avatar */}
        <div className="bg-kaziranga-800 dark:bg-kaziranga-900 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-14 h-14 rounded-full ring-2 ring-gold-500/40 object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-cream-300 text-kaziranga-800 font-display font-black text-xl flex items-center justify-center">
                {user.name.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-lg font-display font-bold text-cream-100 flex items-center gap-2">
                <span>{user.name}</span>
                <span title="Name provided by Google Auth">
                  <Lock className="w-3.5 h-3.5 text-cream-400/50" />
                </span>
              </h2>
              <p className="text-xs text-cream-400/60 font-mono">{user.email}</p>
            </div>
          </div>

          <div>
            {user.role === 'SUPER_ADMIN' ? (
              <Badge variant="gold" size="md">
                <Crown className="w-3.5 h-3.5" />
                <span>Super Admin</span>
              </Badge>
            ) : user.role === 'ADMIN' ? (
              <Badge variant="blue" size="md">
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </Badge>
            ) : (
              <Badge variant="kaziranga" size="md">
                <Shield className="w-3.5 h-3.5 text-gold-400" />
                <span>Student Member</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Editable Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-kaziranga-500 dark:text-cream-400/50 font-display">
              Contact & Academic Information
            </h3>

            <div>
              <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-200 mb-1.5 flex items-center gap-1.5">
                <span>WhatsApp Number <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="arena-input"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-200 mb-1">
                  Region <span className="text-rose-500">*</span>
                </label>
                <select value={region} onChange={(e) => setRegion(e.target.value)} className="arena-select" required>
                  <option value="" disabled>Select Region</option>
                  {availableRegions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-200 mb-1">
                  Academic Level <span className="text-rose-500">*</span>
                </label>
                <select value={level} onChange={(e) => setLevel(e.target.value)} className="arena-select" required>
                  <option value="" disabled>Select Academic Level</option>
                  {availableLevels.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-200 mb-1">
                  Programme <span className="text-rose-500">*</span>
                </label>
                <select value={programme} onChange={(e) => setProgramme(e.target.value)} className="arena-select" required>
                  <option value="" disabled>Select Programme</option>
                  {availableProgrammes.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end">
              <Button type="submit" variant="primary" isLoading={isSaving}>
                Save Profile
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
