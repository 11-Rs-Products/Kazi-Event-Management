'use client';

import React, { useState, useEffect } from 'react';
import { EventItem, EventStatus, RegistrationType, MainEvent } from '@/types';
import { eventSchema } from '@/lib/validation/schemas';
import { Button } from '../ui/Button';
import { AlertCircle, Calendar, Image, Link as LinkIcon, MapPin, Users, Layers, Hash, SortAsc, Plus, Trash2 } from 'lucide-react';
import { getDocs, setDoc, doc } from 'firebase/firestore';
import { db, isMockMode } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { getMainEventsCollectionRef, DEFAULT_TENURE_ID } from '@/lib/firebase/paths';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const quillModules = {
  toolbar: [
    ['bold', 'italic', 'strike'],
    [{ 'color': ['#000000', '#14B8A6', '#C8102E', '#FACC15', '#025A4D', '#FEFDFB', '#4ade80', '#38bdf8'] }],
    ['link', 'list'],
    ['clean']
  ]
};

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
  const [eventGroups, setEventGroups] = useState<MainEvent[]>([]);
  const [mainEventId, setMainEventId] = useState(initialData?.mainEventId || '');
  const [showNewMegaEventInput, setShowNewMegaEventInput] = useState(false);
  const [newMegaEventName, setNewMegaEventName] = useState('');
  const [newMegaEventDescription, setNewMegaEventDescription] = useState('');
  const [newMegaEventCoverImage, setNewMegaEventCoverImage] = useState('');
  
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
  const [customQuestions, setCustomQuestions] = useState<any[]>(initialData?.customQuestions || []);

  const [error, setError] = useState<string | null>(null);

  const handleAddQuestion = () => {
    setCustomQuestions([...customQuestions, { id: Math.random().toString(36).slice(2, 9), question: '', type: 'text', required: false, options: [] }]);
  };

  const handleRemoveQuestion = (id: string) => {
    setCustomQuestions(customQuestions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, field: string, value: any) => {
    setCustomQuestions(customQuestions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  useEffect(() => {
    const fetchGroups = async () => {
      if (isMockMode) {
        // Mock fallback if getEventGroups isn't in mockStore
        const mockGroups: MainEvent[] = [
          { id: 'communityDayAug26', tenureId: '2026-2027', name: 'Community Days', description: '', status: 'PUBLISHED', createdAt: '', updatedAt: '' },
          { id: 'techFest26', tenureId: '2026-2027', name: 'Tech Fest 2026', description: '', status: 'PUBLISHED', createdAt: '', updatedAt: '' },
          { id: 'sportsMeet26', tenureId: '2026-2027', name: 'Annual Sports Meet', description: '', status: 'PUBLISHED', createdAt: '', updatedAt: '' }
        ];
        setEventGroups(mockGroups);
        if (!initialData?.mainEventId) {
          setMainEventId(mockGroups[0].id);
        }
      } else {
        try {
          const snap = await getDocs(getMainEventsCollectionRef(DEFAULT_TENURE_ID));
          const groups: MainEvent[] = [];
          snap.forEach(d => groups.push({ id: d.id, ...d.data() } as MainEvent));
          setEventGroups(groups);
          if (groups.length > 0 && !initialData?.mainEventId) {
            setMainEventId(groups[0].id);
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
      let finalMainEventId = mainEventId;
      
      if (showNewMegaEventInput && newMegaEventName.trim()) {
        const generatedId = newMegaEventName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        finalMainEventId = generatedId;
        
        if (!isMockMode) {
          const mainEventRef = doc(getMainEventsCollectionRef(DEFAULT_TENURE_ID), generatedId);
          await setDoc(mainEventRef, {
            id: generatedId,
            tenureId: DEFAULT_TENURE_ID,
            name: newMegaEventName,
            description: newMegaEventDescription,
            coverImageUrl: newMegaEventCoverImage || null,
            status: 'PUBLISHED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      const parsedMaxPart = maximumParticipants ? parseInt(maximumParticipants, 10) : null;
      const parsedMaxTeam = maximumTeamSize ? parseInt(maximumTeamSize, 10) : null;
      const parsedDisplayOrder = displayOrder ? parseInt(displayOrder, 10) : 0;

      const validated = eventSchema.parse({
        name,
        mainEventId: finalMainEventId,
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
        customQuestions: customQuestions.length > 0 ? customQuestions : undefined,
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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-kaziranga-950 dark:text-white">
                Parent Event <span className="text-rose-500">*</span>
              </label>
              {!showNewMegaEventInput ? (
                <button type="button" onClick={() => setShowNewMegaEventInput(true)} className="text-[10px] text-kaziranga-600 dark:text-gold-400 hover:underline">
                  + New Mega Event
                </button>
              ) : (
                <button type="button" onClick={() => setShowNewMegaEventInput(false)} className="text-[10px] text-rose-500 hover:underline">
                  Cancel
                </button>
              )}
            </div>
            
            {!showNewMegaEventInput ? (
              <select
                required
                value={mainEventId}
                onChange={(e) => setMainEventId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm bg-kaziranga-50/50 dark:bg-kaziranga-900/40 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
              >
                <option value="" disabled>Select a Mega Event...</option>
                {eventGroups.map((group) => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            ) : (
              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-kaziranga-950 dark:text-white mb-1">Mega Event Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newMegaEventName}
                    onChange={(e) => setNewMegaEventName(e.target.value)}
                    placeholder="Enter new mega event name..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-kaziranga-50/50 dark:bg-kaziranga-900/40 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-kaziranga-950 dark:text-white mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={newMegaEventDescription}
                    onChange={(e) => setNewMegaEventDescription(e.target.value)}
                    placeholder="Short description of this mega event collection..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-kaziranga-50/50 dark:bg-kaziranga-900/40 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-kaziranga-950 dark:text-white mb-1">Cover Image URL</label>
                  <input
                    type="url"
                    value={newMegaEventCoverImage}
                    onChange={(e) => setNewMegaEventCoverImage(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-kaziranga-50/50 dark:bg-kaziranga-900/40 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
                  />
                </div>
              </div>
            )}
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
          <div className="bg-white dark:bg-kaziranga-900 rounded-xl overflow-hidden border border-kaziranga-200 dark:border-kaziranga-800">
            <ReactQuill
              theme="snow"
              value={description}
              onChange={setDescription}
              modules={quillModules}
              className="text-kaziranga-950 dark:text-white"
            />
          </div>
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

      {/* Custom Questions Builder */}
      <div className="space-y-4 pt-4 border-t border-kaziranga-100 dark:border-kaziranga-900">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-kaziranga-950 dark:text-white uppercase tracking-wider text-kaziranga-400">
              Registration Form Questions
            </h3>
            <p className="text-[10px] text-kaziranga-500 mt-0.5">Add custom fields for participants to answer during registration.</p>
          </div>
          <Button type="button" size="sm" variant="secondary" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={handleAddQuestion}>
            Add Question
          </Button>
        </div>

        {customQuestions.map((q, idx) => (
          <div key={q.id} className="p-4 bg-kaziranga-50/30 dark:bg-kaziranga-900/20 rounded-xl border border-kaziranga-200 dark:border-kaziranga-800 space-y-3 relative group">
            <button
              type="button"
              onClick={() => handleRemoveQuestion(q.id)}
              className="absolute top-3 right-3 p-1.5 text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pr-10">
              <div className="sm:col-span-6">
                <label className="block text-[11px] font-bold text-kaziranga-600 dark:text-kaziranga-400 uppercase tracking-wider mb-1">
                  Question Text <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={q.question}
                  onChange={(e) => updateQuestion(q.id, 'question', e.target.value)}
                  placeholder="e.g. What is your team name?"
                  className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-kaziranga-950 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-bold text-kaziranga-600 dark:text-kaziranga-400 uppercase tracking-wider mb-1">
                  Answer Type
                </label>
                <select
                  value={q.type}
                  onChange={(e) => updateQuestion(q.id, 'type', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-kaziranga-950 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
                >
                  <option value="text">Short Text</option>
                  <option value="textarea">Paragraph</option>
                  <option value="radio">Multiple Choice (Radio)</option>
                  <option value="checkbox">Checkboxes</option>
                </select>
              </div>
              <div className="sm:col-span-2 flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={q.required}
                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                    className="w-4 h-4 rounded border-kaziranga-300 text-kaziranga-600 focus:ring-kaziranga-600 bg-white dark:bg-kaziranga-900"
                  />
                  <span className="text-xs font-bold text-kaziranga-800 dark:text-kaziranga-200">Required</span>
                </label>
              </div>
            </div>

            {(q.type === 'radio' || q.type === 'checkbox') && (
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-kaziranga-600 dark:text-kaziranga-400 uppercase tracking-wider mb-1">
                  Options (Comma separated) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={(q.options || []).join(', ')}
                  onChange={(e) => updateQuestion(q.id, 'options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="Option 1, Option 2, Option 3"
                  className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-kaziranga-950 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
                />
              </div>
            )}
          </div>
        ))}
        {customQuestions.length === 0 && (
          <div className="text-xs text-kaziranga-500 italic p-4 text-center border border-dashed border-kaziranga-200 dark:border-kaziranga-800 rounded-xl">
            No custom questions added.
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-kaziranga-100 dark:border-kaziranga-900">
        <Button type="submit" variant="primary" size="lg" isLoading={isLoading}>
          Save Event
        </Button>
      </div>
    </form>
  );
};
