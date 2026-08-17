'use client';

import React, { useState, useEffect } from 'react';
import { EventItem, EventStatus, EventGroup } from '@/types';
import { eventSchema } from '@/lib/validation/schemas';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Calendar, MapPin, Link as LinkIcon, AlertCircle, Hash, SortAsc, Layers } from 'lucide-react';
import { isMockMode, db } from '@/lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { INITIAL_EVENT_GROUPS } from '@/lib/firebase/mockData';

interface EventFormProps {
  initialData?: Partial<EventItem>;
  onSubmit: (data: Partial<EventItem>) => Promise<void>;
  isLoading?: boolean;
}

export const EventForm: React.FC<EventFormProps> = ({
  initialData,
  onSubmit,
  isLoading = false,
}) => {
  const [groupId, setGroupId] = useState(initialData?.groupId || '');
  const [name, setName] = useState(initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || 'Technical');
  const [venue, setVenue] = useState(initialData?.venue || '');
  const [startDateTime, setStartDateTime] = useState(
    initialData?.startDateTime ? new Date(initialData.startDateTime).toISOString().slice(0, 16) : ''
  );
  const [endDateTime, setEndDateTime] = useState(
    initialData?.endDateTime ? new Date(initialData.endDateTime).toISOString().slice(0, 16) : ''
  );
  const [registrationDeadline, setRegistrationDeadline] = useState(
    initialData?.registrationDeadline
      ? new Date(initialData.registrationDeadline).toISOString().slice(0, 16)
      : ''
  );
  const [maximumParticipants, setMaximumParticipants] = useState<number | ''>(
    initialData?.maximumParticipants !== undefined && initialData?.maximumParticipants !== null
      ? initialData.maximumParticipants
      : ''
  );
  const [status, setStatus] = useState<EventStatus>(initialData?.status || 'DRAFT');
  const [coverImageUrl, setCoverImageUrl] = useState(initialData?.coverImageUrl || '');
  const [rulebookUrl, setRulebookUrl] = useState(initialData?.rulebookUrl || '');
  const [displayOrder, setDisplayOrder] = useState<number | ''>(
    initialData?.displayOrder !== undefined ? initialData.displayOrder : 0
  );

  const [eventGroups, setEventGroups] = useState<EventGroup[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      if (isMockMode) {
        setEventGroups(INITIAL_EVENT_GROUPS);
      } else {
        try {
          const snap = await getDocs(collection(db, 'events'));
          const groups: EventGroup[] = [];
          snap.forEach(d => groups.push({ id: d.id, ...d.data() } as EventGroup));
          setEventGroups(groups);
        } catch (e) {
          console.error("Failed to load event groups:", e);
        }
      }
    };
    fetchGroups();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const payload: Partial<EventItem> = {
        groupId,
        name,
        slug,
        description,
        category,
        venue,
        startDateTime: new Date(startDateTime).toISOString(),
        endDateTime: new Date(endDateTime).toISOString(),
        registrationDeadline: new Date(registrationDeadline).toISOString(),
        maximumParticipants: maximumParticipants === '' ? null : Number(maximumParticipants),
        status,
        coverImageUrl: coverImageUrl || null,
        rulebookUrl: rulebookUrl || null,
        displayOrder: displayOrder === '' ? 0 : Number(displayOrder),
      };

      eventSchema.parse({
        ...payload,
        id: initialData?.id || 'temp-id',
        currentRegistrationCount: initialData?.currentRegistrationCount || 0,
        createdAt: initialData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: initialData?.createdBy || 'system',
      });

      await onSubmit(payload);
    } catch (err: any) {
      if (err.errors && err.errors[0]?.message) {
        setError(err.errors[0].message);
      } else {
        setError(err.message || 'Validation failed. Please verify the event details.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200/60 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Parent Event Selection */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-display font-bold text-kaziranga-800 dark:text-cream-100 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-gold-500" />
          <span>Event Collection & Category</span>
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-100 mb-1.5">
              Parent Event Collection <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="arena-select"
            >
              <option value="" disabled>Select an Event Collection...</option>
              {eventGroups.map((group) => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-100 mb-1.5">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="arena-select"
            >
              <option value="Technical">Technical</option>
              <option value="Cultural">Cultural</option>
              <option value="Sports">Sports</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Basic Event Information */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-display font-bold text-kaziranga-800 dark:text-cream-100 uppercase tracking-wider">
          General Challenge Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-100 mb-1.5">
              Challenge Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hackathon"
              className="arena-input"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-100 mb-1.5">
              URL Slug <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-kaziranga-400" />
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="hackathon"
                className="arena-input pl-10 font-mono"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-100 mb-1.5">
            Description & Rules <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide a detailed description of rules, format, house points, and eligibility..."
            className="arena-input"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-100 mb-1.5">
              Display Order
            </label>
            <div className="relative">
              <SortAsc className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-kaziranga-400" />
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value === '' ? '' : Number(e.target.value))}
                className="arena-input pl-10"
              />
            </div>
            <p className="text-[10px] text-kaziranga-500 dark:text-cream-400/50 mt-1">Lower numbers appear first.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-100 mb-1.5">
              Venue / Location <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. SAC Indoor Stadium"
              className="arena-input"
            />
          </div>
        </div>
      </Card>

      {/* Schedule & Deadlines */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-display font-bold text-kaziranga-800 dark:text-cream-100 uppercase tracking-wider">
          Schedule & Registration Limits
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-100 mb-1.5">
              Start Date & Time <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
              className="arena-input"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-100 mb-1.5">
              End Date & Time <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
              className="arena-input"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-100 mb-1.5">
              Registration Deadline <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={registrationDeadline}
              onChange={(e) => setRegistrationDeadline(e.target.value)}
              className="arena-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-100 mb-1.5">
              Max Participants (Optional)
            </label>
            <input
              type="number"
              min="1"
              value={maximumParticipants}
              onChange={(e) => setMaximumParticipants(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Leave blank for unlimited"
              className="arena-input"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-100 mb-1.5">
              Event Status <span className="text-rose-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EventStatus)}
              className="arena-select"
            >
              <option value="DRAFT">DRAFT (Admin only)</option>
              <option value="PUBLISHED">PUBLISHED (Open for users)</option>
              <option value="CLOSED">CLOSED (Registration locked)</option>
              <option value="COMPLETED">COMPLETED (Finished)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Media & Links */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-display font-bold text-kaziranga-800 dark:text-cream-100 uppercase tracking-wider">
          Media & Rulebook Links
        </h3>

        <div>
          <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-100 mb-1.5">
            Cover Image URL
          </label>
          <input
            type="url"
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            placeholder="https://images.unsplash.com/photo-..."
            className="arena-input"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-100 mb-1.5">
            Rulebook PDF / Drive Link
          </label>
          <input
            type="url"
            value={rulebookUrl}
            onChange={(e) => setRulebookUrl(e.target.value)}
            placeholder="https://drive.google.com/..."
            className="arena-input"
          />
        </div>
      </Card>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="submit" variant="primary" size="lg" isLoading={isLoading}>
          Save Event
        </Button>
      </div>
    </form>
  );
};
