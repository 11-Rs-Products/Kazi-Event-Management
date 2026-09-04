'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { userProfileSchema } from '@/lib/validation/schemas';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { SectionHeading } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Motion';
import { Lock, Crown, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

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

  const roleBadge =
    user.role === 'SUPER_ADMIN' ? (
      <Badge tone="accent" solid>
        <Crown className="w-3.5 h-3.5" aria-hidden />
        Super Admin
      </Badge>
    ) : user.role === 'ADMIN' ? (
      <Badge tone="info" solid>
        <Shield className="w-3.5 h-3.5" aria-hidden />
        Admin
      </Badge>
    ) : (
      <Badge tone="neutral" className="dark:bg-white/10 dark:text-white/80 dark:border-white/20">
        Student Member
      </Badge>
    );

  return (
    <div className="space-y-7 max-w-3xl mx-auto">
      <SectionHeading
        eyebrow="Your account"
        title="Profile"
        description="These details are copied into every registration you make, so keep them current."
        size="lg"
        as="h1"
      />

      {successMsg && (
        <Reveal y={8}>
          <div
            role="status"
            className="flex items-start gap-2.5 p-4 rounded-2xl bg-signal-live/10 border border-signal-live/25 text-signal-live text-caption"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
            <span>{successMsg}</span>
          </div>
        </Reveal>
      )}

      {errorMsg && (
        <Reveal y={8}>
          <div
            role="alert"
            className="flex items-start gap-2.5 p-4 rounded-2xl bg-signal-danger/10 border border-signal-danger/25 text-signal-danger text-caption"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
            <span>{errorMsg}</span>
          </div>
        </Reveal>
      )}

      <Card elevation={2}>
        {/* Identity band — the parts Google owns and the student cannot edit. */}
        <div className="bg-surface-sunken border-b border-hairline dark:ed-stage dark:ed-mesh dark:border-transparent relative px-6 py-6 flex flex-wrap items-center justify-between gap-4">
          <div className="relative z-[2] flex items-center gap-4 min-w-0">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="w-16 h-16 rounded-full object-cover ring-2 ring-[rgb(var(--accent-vivid))]/40 shrink-0"
              />
            ) : (
              <span
                className="grid place-items-center w-16 h-16 rounded-full shrink-0
                  bg-[rgb(var(--accent-vivid))] text-accent-contrast font-display font-black text-title-lg"
                aria-hidden
              >
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <h2 className="font-display font-extrabold text-title text-ink dark:text-white flex items-center gap-2 min-w-0">
                <span className="truncate">{user.name}</span>
                <Lock
                  className="w-3.5 h-3.5 text-ink-faint dark:text-white/40 shrink-0"
                  aria-label="Name is managed by your Google account"
                />
              </h2>
              <p className="text-caption font-mono text-ink-muted dark:text-white/50 truncate">{user.email}</p>
            </div>
          </div>
          <div className="relative z-[2]">{roleBadge}</div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="ed-eyebrow">Contact &amp; academic details</div>

          <Input
            type="tel"
            required
            label="WhatsApp number"
            hint="Organisers use this to reach you about your events."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 9876543210"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              required
              label="Region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              <option value="" disabled>
                Select region
              </option>
              {availableRegions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>

            <Select
              required
              label="Academic level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option value="" disabled>
                Select level
              </option>
              {availableLevels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>

            <Select
              required
              label="Programme"
              value={programme}
              onChange={(e) => setProgramme(e.target.value)}
            >
              <option value="" disabled>
                Select programme
              </option>
              {availableProgrammes.map((pr) => (
                <option key={pr} value={pr}>
                  {pr}
                </option>
              ))}
            </Select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-hairline">
            <Button type="submit" variant="primary" size="lg" isLoading={isSaving} className="mt-6">
              Save changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
