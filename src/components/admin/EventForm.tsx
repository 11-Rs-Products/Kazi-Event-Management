'use client';

import React, { useState, useEffect } from 'react';
import { EventItem, EventStatus, RegistrationType, EventGroup } from '@/types';
import { eventSchema } from '@/lib/validation/schemas';
import { Button } from '../ui/Button';
import { AlertCircle, Calendar, Image, Link as LinkIcon, MapPin, Users, Layers, Hash, SortAsc } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db, isMockMode } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';

interface EventFormProps {
  initialData?: Partial<EventItem>;
  onSubmit: (data: Omit<EventItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => Promise<void>;
  isLoading?: boolean;
}

export const EventForm: React.FC<EventFormProps> = ({
  initialData,
  onSubmit,
  isLoading = false,
}) => {
  const [eventGroups, setEventGroups] = useState<EventGroup[]>([]);
  const [groupId, setGroupId] = useState(initialData?.groupId || '');
  const [name, setName] = useState(initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || 'Technical');
  const [displayOrder, setDisplayOrder] = useState<string>(initialData?.displayOrder ? String(initialData.displayOrder) : '0');
  
  const [startDateTime, setStartDateTime] = useState(
    initialData?.startDateTime ? new Date(initialData.startDateTime).toISOString().slice(0, 16) : ''
  );
  const [endDateTime, setEndDateTime] = useState(
    initialData?.endDateTime ? new Date(initialData.endDateTime).toISOString().slice(0, 16) : ''
  );
  const [registrationDeadline, setRegistrationDeadline] = useState(
    initialData?.registrationDeadline ? new Date(initialData.registrationDeadline).toISOString().slice(0, 16) : ''
  );
  const [venue, setVenue] = useState(initialData?.venue || '');
  const [registrationType, setRegistrationType] = useState<RegistrationType>(initialData?.registrationType || 'INDIVIDUAL');
  const [maximumParticipants, setMaximumParticipants] = useState<string>(
    initialData?.maximumParticipants ? String(initialData.maximumParticipants) : ''
  );
  const [maximumTeamSize, setMaximumTeamSize] = useState<string>(
    initialData?.maximumTeamSize ? String(initialData.maximumTeamSize) : ''
  );
  const [rulebookUrl, setRulebookUrl] = useState(initialData?.rulebookUrl || '');
  const [coverImageUrl, setCoverImageUrl] = useState(initialData?.coverImageUrl || '');
  const [status, setStatus] = useState<EventStatus>(initialData?.status || 'DRAFT');

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      if (isMockMode) {
        // Mock fallback if getEventGroups isn't in mockStore
        setEventGroups([{ id: 'communityDayAug26', name: 'Community Days', description: '', coverImageUrl: null, status: 'PUBLISHED', createdBy: 'admin', createdAt: '', updatedAt: '' }]);
      } else {
        try {
          const snap = await getDocs(collection(db, 'events'));
          const groups: EventGroup[] = [];
          snap.forEach(d => groups.push({ id: d.id, ...d.data() } as EventGroup));
          setEventGroups(groups);
          if (groups.length > 0 && !initialData?.groupId) {
            setGroupId(groups[0].id);
          }
        } catch (err) {
          console.error("Error fetching event groups", err);
        }
      }
    };
    fetchGroups();
  }, [initialData]);

  useEffect(() => {
    if (name && !initialData?.slug) {
      setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  }, [name, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const parsedMaxPart = maximumParticipants ? parseInt(maximumParticipants, 10) : null;
      const parsedMaxTeam = maximumTeamSize ? parseInt(maximumTeamSize, 10) : null;
      const parsedDisplayOrder = displayOrder ? parseInt(displayOrder, 10) : 0;

      const validated = eventSchema.parse({
        name,
        groupId,
        slug,
        description,
        category,
        displayOrder: parsedDisplayOrder,
        startDateTime: new Date(startDateTime).toISOString(),
        endDateTime: new Date(endDateTime).toISOString(),
        registrationDeadline: new Date(registrationDeadline).toISOString(),
        venue,
        registrationType,
        maximumParticipants: parsedMaxPart,
        maximumTeamSize: parsedMaxTeam,
        rulebookUrl: rulebookUrl || null,
        coverImageUrl: coverImageUrl || null,
        status,
      });

      await onSubmit(validated as any);
    } catch (err: any) {
      if (err.errors && err.errors[0]?.message) {
        setError(err.errors[0].message);
      } else {
        setError(err.message || 'Validation error');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Parent Event Selection */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-kaziranga-950 dark:text-white uppercase tracking-wider text-kaziranga-400 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Mega Event Details
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-kaziranga-950 dark:text-white mb-1">
              Parent Event <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm bg-kaziranga-50/50 dark:bg-kaziranga-900/40 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
            >
              <option value="" disabled>Select a Mega Event...</option>
              {eventGroups.map((group) => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-kaziranga-950 dark:text-white mb-1">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm bg-kaziranga-50/50 dark:bg-kaziranga-900/40 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
            >
              <option value="Technical">Technical</option>
              <option value="Cultural">Cultural</option>
              <option value="Sports">Sports</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Basic Event Information */}
      <div className="space-y-4 pt-4 border-t border-kaziranga-100 dark:border-kaziranga-900">
        <h3 className="text-sm font-bold text-kaziranga-950 dark:text-white uppercase tracking-wider text-kaziranga-400">
          General Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-kaziranga-950 dark:text-white mb-1">
              Event Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hackathon"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-kaziranga-50/50 dark:bg-kaziranga-900/40 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-kaziranga-950 dark:text-white mb-1">
              URL Slug <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kaziranga-400" />
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="hackathon"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-kaziranga-50/50 dark:bg-kaziranga-900/40 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-kaziranga-600 font-mono"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-kaziranga-950 dark:text-white mb-1">
            Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide a detailed description of rules, format, house points, and eligibility..."
            className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-kaziranga-50/50 dark:bg-kaziranga-900/40 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-kaziranga-950 dark:text-white mb-1">
              Display Order
            </label>
            <div className="relative">
              <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kaziranga-400" />
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-kaziranga-50/50 dark:bg-kaziranga-900/40 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
              />
            </div>
            <p className="text-[10px] text-kaziranga-500 mt-1">Lower numbers appear first.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-kaziranga-950 dark:text-white mb-1">
              Venue / Location <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. SAC Indoor Stadium"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-kaziranga-50/50 dark:bg-kaziranga-900/40 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
            />
          </div>
        </div>
      </div>

      {/* Schedule & Deadlines */}
      <div className="space-y-4 pt-4 border-t border-kaziranga-100 dark:border-kaziranga-900">
        <h3 className="text-sm font-bold text-kaziranga-950 dark:text-white uppercase tracking-wider text-kaziranga-400">
          Schedule & Limits
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-kaziranga-950 dark:text-white mb-1">
              Start Date & Time <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-kaziranga-50/50 dark:bg-kaziranga-900/40 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-kaziranga-950 dark:text-white mb-1">
              End Date & Time <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-kaziranga-50/50 dark:bg-kaziranga-900/40 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-kaziranga-950 dark:text-white mb-1">
              Registration Deadline <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={registrationDeadline}
              onChange={(e) => setRegistrationDeadline(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-kaziranga-50/50 dark:bg-kaziranga-900/40 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-kaziranga-950 dark:text-white mb-1">
              Max Participants (Optional)
            </label>
            <input
              type="number"
              min="1"
              value={maximumParticipants}
              onChange={(e) => setMaximumParticipants(e.target.value)}
              placeholder="Leave blank for unlimited"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-kaziranga-50/50 dark:bg-kaziranga-900/40 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-kaziranga-950 dark:text-white mb-1">
              Event Status <span className="text-rose-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EventStatus)}
              className="w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm bg-kaziranga-50/50 dark:bg-kaziranga-900/40 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
            >
              <option value="DRAFT">DRAFT (Admin only)</option>
              <option value="PUBLISHED">PUBLISHED (Open for users)</option>
              <option value="CLOSED">CLOSED (Registration locked)</option>
              <option value="COMPLETED">COMPLETED (Finished)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Media & Links */}
      <div className="space-y-4 pt-4 border-t border-kaziranga-100 dark:border-kaziranga-900">
        <h3 className="text-sm font-bold text-kaziranga-950 dark:text-white uppercase tracking-wider text-kaziranga-400">
          Media & Rulebook
        </h3>

        <div>
          <label className="block text-xs font-bold text-kaziranga-950 dark:text-white mb-1">
            Cover Image URL
          </label>
          <input
            type="url"
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            placeholder="https://images.unsplash.com/photo-..."
            className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-kaziranga-50/50 dark:bg-kaziranga-900/40 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-kaziranga-950 dark:text-white mb-1">
            Rulebook PDF / Drive Link
          </label>
          <input
            type="url"
            value={rulebookUrl}
            onChange={(e) => setRulebookUrl(e.target.value)}
            placeholder="https://drive.google.com/..."
            className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-kaziranga-50/50 dark:bg-kaziranga-900/40 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-kaziranga-100 dark:border-kaziranga-900">
        <Button type="submit" variant="primary" size="lg" isLoading={isLoading}>
          Save Event
        </Button>
      </div>
    </form>
  );
};
