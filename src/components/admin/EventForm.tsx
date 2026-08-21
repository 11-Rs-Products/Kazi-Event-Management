'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EventItem, EventStatus, RegistrationType, MainEvent } from '@/types';
import { eventSchema } from '@/lib/validation/schemas';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EventStatusBadge } from '@/components/events/EventStatusBadge';
import { getOptimizedImageUrl } from '@/lib/utils/imageFormatter';
import { AlertCircle, Calendar, Image, Link as LinkIcon, MapPin, Users, Layers, Hash, SortAsc, Plus, Trash2, CheckCircle2, AlertTriangle, Eye, X, FileText, ExternalLink, Clock, ArrowLeft, UploadCloud } from 'lucide-react';
import { getDocs, setDoc, doc, query, where } from 'firebase/firestore';
import { db, isMockMode } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { getMainEventsCollectionRef, getEventsCollectionRef, DEFAULT_TENURE_ID } from '@/lib/firebase/paths';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// @ts-ignore
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false }) as any;

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['link', 'clean']
  ],
  clipboard: {
    matchVisual: false,
    matchers: [
      [1, function (node: any, delta: any) { // 1 is Node.ELEMENT_NODE
        delta.ops.forEach((op: any) => {
          if (op.attributes) {
            delete op.attributes.color;
            delete op.attributes.background;
          }
        });
        return delta;
      }]
    ]
  }
};

const quillFormats = [
  'header',
  'size',
  'bold',
  'italic',
  'underline',
  'strike',
  'color',
  'background',
  'align',
  'list',
  'bullet',
  'link'
];

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
  const [nameError, setNameError] = useState<string | null>(null);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [slugError, setSlugError] = useState<string | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState<string[]>(() => {
    if (Array.isArray(initialData?.category)) return initialData.category;
    if (typeof initialData?.category === 'string') return [initialData.category];
    return ['Technical'];
  });
  const [displayOrder, setDisplayOrder] = useState<string>(initialData?.displayOrder ? String(initialData.displayOrder) : '1');
  const [orderError, setOrderError] = useState<string | null>(null);
  const [isCheckingOrder, setIsCheckingOrder] = useState(false);
  
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
  const [status, setStatus] = useState<EventStatus | ''>(initialData?.status || '');
  const [customQuestions, setCustomQuestions] = useState<any[]>(initialData?.customQuestions || []);
  const [requireSubmission, setRequireSubmission] = useState(initialData?.requireSubmission || false);
  const [submissionTiming, setSubmissionTiming] = useState<string[]>(() => {
    if (Array.isArray(initialData?.submissionTiming)) return initialData.submissionTiming;
    if (typeof initialData?.submissionTiming === 'string') return [initialData.submissionTiming];
    return [];
  });
  const [submissionRequirements, setSubmissionRequirements] = useState<any[]>(() => {
    if (initialData?.submissionRequirements && initialData.submissionRequirements.length > 0) {
      const timings = Array.isArray(initialData?.submissionTiming)
        ? initialData.submissionTiming
        : typeof initialData?.submissionTiming === 'string'
        ? [initialData.submissionTiming]
        : [];
      return initialData.submissionRequirements.map((r: any) => ({
        ...r,
        timing: r.timing || (timings.includes('DURING_REGISTRATION') ? 'DURING_REGISTRATION' : 'AFTER_REGISTRATION'),
      }));
    }
    return [];
  });
  const [duringSubmissionInstructions, setDuringSubmissionInstructions] = useState(
    initialData?.duringSubmissionInstructions || (initialData?.submissionTiming?.includes('DURING_REGISTRATION') ? initialData?.submissionInstructions : '') || ''
  );
  const [afterSubmissionInstructions, setAfterSubmissionInstructions] = useState(
    initialData?.afterSubmissionInstructions || (initialData?.submissionTiming?.includes('AFTER_REGISTRATION') ? initialData?.submissionInstructions : '') || ''
  );
  const [submissionDeadline, setSubmissionDeadline] = useState(
    initialData?.submissionDeadline ? new Date(initialData.submissionDeadline).toISOString().slice(0, 16) : ''
  );

  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [validatedPayload, setValidatedPayload] = useState<any>(null);

  const handleAddQuestion = () => {
    setCustomQuestions([...customQuestions, { id: Math.random().toString(36).slice(2, 9), question: '', type: 'text', required: false, options: [] }]);
  };

  const handleRemoveQuestion = (id: string) => {
    setCustomQuestions(customQuestions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, field: string, value: any) => {
    setCustomQuestions(customQuestions.map(q => {
      if (q.id === id) {
        const updated = { ...q, [field]: value };
        if (field === 'type' && (value === 'radio' || value === 'checkbox') && (!q.options || q.options.length === 0)) {
          updated.options = ['', ''];
        }
        return updated;
      }
      return q;
    }));
  };

  const handleAddOption = (questionId: string) => {
    setCustomQuestions(customQuestions.map(q => {
      if (q.id === questionId) {
        return { ...q, options: [...(q.options || []), ''] };
      }
      return q;
    }));
  };

  const handleUpdateOption = (questionId: string, optIndex: number, value: string) => {
    setCustomQuestions(customQuestions.map(q => {
      if (q.id === questionId) {
        const newOptions = [...(q.options || [])];
        newOptions[optIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const handleRemoveOption = (questionId: string, optIndex: number) => {
    setCustomQuestions(customQuestions.map(q => {
      if (q.id === questionId) {
        const newOptions = (q.options || []).filter((_: any, idx: number) => idx !== optIndex);
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const handleAddSubmissionReq = (timing: 'DURING_REGISTRATION' | 'AFTER_REGISTRATION' = 'DURING_REGISTRATION') => {
    setSubmissionRequirements([
      ...submissionRequirements,
      {
        id: Math.random().toString(36).slice(2, 9),
        label: '',
        type: 'LINK',
        timing,
        deadline: null,
      },
    ]);
  };
  const handleRemoveSubmissionReq = (id: string) => {
    setSubmissionRequirements(submissionRequirements.filter(r => r.id !== id));
  };
  const updateSubmissionReq = (id: string, field: string, value: any) => {
    setSubmissionRequirements(submissionRequirements.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleToggleRequireSubmission = (checked: boolean) => {
    setRequireSubmission(checked);
  };

  const handleToggleDuringReg = (checked: boolean) => {
    if (checked) {
      setSubmissionTiming(prev => [...prev.filter(t => t !== 'DURING_REGISTRATION'), 'DURING_REGISTRATION']);
      const hasDuring = submissionRequirements.some(r => (r.timing || 'DURING_REGISTRATION') === 'DURING_REGISTRATION');
      if (!hasDuring) {
        setSubmissionRequirements(prev => [
          ...prev,
          {
            id: Math.random().toString(36).slice(2, 9),
            label: '',
            type: 'LINK',
            timing: 'DURING_REGISTRATION',
            deadline: null,
          },
        ]);
      }
    } else {
      setSubmissionTiming(prev => prev.filter(t => t !== 'DURING_REGISTRATION'));
    }
  };

  const handleToggleAfterReg = (checked: boolean) => {
    if (checked) {
      setSubmissionTiming(prev => [...prev.filter(t => t !== 'AFTER_REGISTRATION'), 'AFTER_REGISTRATION']);
      const hasAfter = submissionRequirements.some(r => r.timing === 'AFTER_REGISTRATION');
      if (!hasAfter) {
        setSubmissionRequirements(prev => [
          ...prev,
          {
            id: Math.random().toString(36).slice(2, 9),
            label: '',
            type: 'LINK',
            timing: 'AFTER_REGISTRATION',
            deadline: null,
          },
        ]);
      }
    } else {
      setSubmissionTiming(prev => prev.filter(t => t !== 'AFTER_REGISTRATION'));
    }
  };

  useEffect(() => {
    const tooltips: Record<string, string> = {
      '.ql-size': 'Font Size',
      '.ql-header': 'Heading Style (Paragraph / H1 / H2 / H3)',
      '.ql-bold': 'Bold (Ctrl+B)',
      '.ql-italic': 'Italic (Ctrl+I)',
      '.ql-underline': 'Underline (Ctrl+U)',
      '.ql-strike': 'Strikethrough',
      '.ql-color': 'Text Color',
      '.ql-background': 'Background Highlight Color',
      '.ql-align': 'Text Alignment (Left / Center / Right / Justify)',
      '.ql-list[value="ordered"]': 'Numbered List',
      '.ql-list[value="bullet"]': 'Bulleted List',
      '.ql-link': 'Insert Web Link',
      '.ql-clean': 'Clear All Formatting',
    };

    const attachTooltips = () => {
      Object.entries(tooltips).forEach(([selector, title]) => {
        document.querySelectorAll(selector).forEach((el) => {
          if (!el.getAttribute('title')) {
            el.setAttribute('title', title);
            el.setAttribute('aria-label', title);
          }
        });
      });
    };

    const timeout = setTimeout(attachTooltips, 100);
    const interval = setInterval(attachTooltips, 500);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (showPreviewModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showPreviewModal]);

  useEffect(() => {
    const fetchGroups = async () => {
      if (isMockMode) {
        // Mock fallback if getEventGroups isn't in mockStore
        const mockGroups: MainEvent[] = [
          { id: 'communityDayAug26', tenureId: '2026-2027', name: "Community Day Aug'26", description: '', status: 'PUBLISHED', createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), updatedAt: '' },
          { id: 'techFest26', tenureId: '2026-2027', name: 'Tech Fest 2026', description: '', status: 'PUBLISHED', createdAt: new Date(Date.now() - 10 * 86400000).toISOString(), updatedAt: '' },
          { id: 'sportsMeet26', tenureId: '2026-2027', name: 'Annual Sports Meet', description: '', status: 'PUBLISHED', createdAt: new Date(Date.now() - 20 * 86400000).toISOString(), updatedAt: '' }
        ];
        const sorted = [...mockGroups].sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });
        setEventGroups(sorted);
        if (!initialData?.mainEventId && sorted.length > 0) {
          setMainEventId(sorted[0].id);
        }
      } else {
        try {
          const snap = await getDocs(getMainEventsCollectionRef(DEFAULT_TENURE_ID));
          const groups: MainEvent[] = [];
          snap.forEach(d => groups.push({ id: d.id, ...d.data() } as MainEvent));

          // Sort descending: latest one at top, oldest one at bottom
          const sorted = groups.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            if (timeB !== timeA) return timeB - timeA;
            return b.id.localeCompare(a.id);
          });

          setEventGroups(sorted);
          if (sorted.length > 0 && !initialData?.mainEventId) {
            setMainEventId(sorted[0].id);
          }
        } catch (err) {
          console.error("Error fetching event groups", err);
        }
      }
    };
    fetchGroups();
  }, [initialData]);

  useEffect(() => {
    if (!initialData?.slug) {
      setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  }, [name, initialData]);

  // Calculate default display order
  useEffect(() => {
    let isMounted = true;
    const calculateSmallestOrder = async () => {
      // Only auto-calculate for new events
      if (initialData?.id) return;
      
      const currentGroupId = mainEventId || 'communityDayAug26';
      let orders: number[] = [];

      if (isMockMode) {
        const allEvents = mockStore.getEvents();
        orders = allEvents
          .filter(e => e.mainEventId === currentGroupId || (!e.mainEventId && currentGroupId === 'communityDayAug26'))
          .map(e => Number(e.displayOrder) || 1);
      } else {
        try {
          const q = query(getEventsCollectionRef(DEFAULT_TENURE_ID, currentGroupId));
          const snap = await getDocs(q);
          orders = snap.docs.map(d => Number(d.data().displayOrder) || 1);
        } catch (err) {
          console.error(err);
        }
      }

      if (isMounted) {
        let nextRank = 1;
        const taken = new Set(orders);
        while (taken.has(nextRank)) {
          nextRank++;
        }
        setDisplayOrder(String(nextRank));
      }
    };
    calculateSmallestOrder();
    return () => { isMounted = false; };
  }, [mainEventId, initialData?.id]);

  // Real-time Event Title Uniqueness Validator
  useEffect(() => {
    if (!name.trim()) {
      setNameError(null);
      setIsCheckingName(false);
      return;
    }

    let isMounted = true;
    const checkNameUniqueness = async () => {
      setIsCheckingName(true);
      const cleanName = name.trim().toLowerCase();
      const currentGroupId = mainEventId || 'communityDayAug26';

      let isDuplicate = false;
      if (isMockMode) {
        const allEvents = mockStore.getEvents();
        isDuplicate = allEvents.some(
          e => e.name?.trim().toLowerCase() === cleanName && e.id !== initialData?.id
        );
      } else {
        try {
          const nameQ = query(
            getEventsCollectionRef(DEFAULT_TENURE_ID, currentGroupId),
            where('name', '==', name.trim())
          );
          const snap = await getDocs(nameQ);
          const dupes = snap.docs.filter(d => d.id !== initialData?.id);
          isDuplicate = dupes.length > 0;
        } catch (err) {
          console.error('Event title uniqueness check error:', err);
        }
      }

      if (isMounted) {
        if (isDuplicate) {
          setNameError(`An event titled "${name.trim()}" already exists. Please choose a unique title.`);
        } else {
          setNameError(null);
        }
        setIsCheckingName(false);
      }
    };

    const timer = setTimeout(checkNameUniqueness, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [name, mainEventId, initialData?.id]);

  // Real-time Slug Uniqueness Validator
  useEffect(() => {
    if (!slug.trim()) {
      setSlugError(null);
      setIsCheckingSlug(false);
      return;
    }

    let isMounted = true;
    const checkSlugUniqueness = async () => {
      setIsCheckingSlug(true);
      const cleanSlug = slug.toLowerCase().trim();
      const currentGroupId = mainEventId || 'communityDayAug26';

      let isDuplicate = false;
      if (isMockMode) {
        const allEvents = mockStore.getEvents();
        isDuplicate = allEvents.some(
          e => (e.slug?.toLowerCase() === cleanSlug || e.id?.toLowerCase() === cleanSlug) && e.id !== initialData?.id
        );
      } else {
        try {
          const slugQ = query(
            getEventsCollectionRef(DEFAULT_TENURE_ID, currentGroupId),
            where('slug', '==', cleanSlug)
          );
          const snap = await getDocs(slugQ);
          const dupes = snap.docs.filter(d => d.id !== initialData?.id);
          isDuplicate = dupes.length > 0;
        } catch (err) {
          console.error('Slug uniqueness check error:', err);
        }
      }

      if (isMounted) {
        if (isDuplicate) {
          setSlugError(`"/${cleanSlug}" is already in use by another activity. Please choose a unique URL slug.`);
        } else {
          setSlugError(null);
        }
        setIsCheckingSlug(false);
      }
    };

    const timer = setTimeout(checkSlugUniqueness, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [slug, mainEventId, initialData?.id]);

  // Real-time Display Order Uniqueness Validator
  useEffect(() => {
    const parsed = parseInt(displayOrder, 10);
    if (isNaN(parsed) || parsed < 1) {
      setOrderError('Display order must be a positive number (1, 2, 3...)');
      setIsCheckingOrder(false);
      return;
    }

    let isMounted = true;
    const checkOrderUniqueness = async () => {
      setIsCheckingOrder(true);
      const currentGroupId = mainEventId || 'communityDayAug26';

      let duplicateEventName: string | null = null;
      if (isMockMode) {
        const allEvents = mockStore.getEvents();
        const conflict = allEvents.find(
          e => (e.mainEventId === currentGroupId || (!e.mainEventId && currentGroupId === 'communityDayAug26')) &&
               Number(e.displayOrder) === parsed &&
               e.id !== initialData?.id
        );
        if (conflict) {
          duplicateEventName = conflict.name;
        }
      } else {
        try {
          const orderQ = query(
            getEventsCollectionRef(DEFAULT_TENURE_ID, currentGroupId),
            where('displayOrder', '==', parsed)
          );
          const snap = await getDocs(orderQ);
          const dupes = snap.docs.filter(d => d.id !== initialData?.id);
          if (dupes.length > 0) {
            duplicateEventName = (dupes[0].data() as any)?.name || `Event #${dupes[0].id}`;
          }
        } catch (err) {
          console.error('Display order uniqueness check error:', err);
        }
      }

      if (isMounted) {
        if (duplicateEventName) {
          setOrderError(`Position #${parsed} is already taken by "${duplicateEventName}". Please choose an unused position.`);
        } else {
          setOrderError(null);
        }
        setIsCheckingOrder(false);
      }
    };

    const timer = setTimeout(checkOrderUniqueness, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [displayOrder, mainEventId, initialData?.id]);

  const validateForm = () => {
    setError(null);

    if (nameError) {
      setError(nameError);
      return null;
    }

    if (slugError) {
      setError(slugError);
      return null;
    }

    if (orderError) {
      setError(orderError);
      return null;
    }

    try {
      let finalMainEventId = mainEventId;
      
      if (showNewMegaEventInput && newMegaEventName.trim()) {
        const generatedId = newMegaEventName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        finalMainEventId = generatedId;
      }

      const parsedMaxPart = maximumParticipants ? parseInt(maximumParticipants, 10) : null;
      const parsedMaxTeam = maximumTeamSize ? parseInt(maximumTeamSize, 10) : null;
      const parsedDisplayOrder = displayOrder ? parseInt(displayOrder, 10) : 1;

      if (requireSubmission) {
        if (!submissionTiming || submissionTiming.length === 0) {
          setError('Please select at least one submission collection timing.');
          return null;
        }

        if (submissionTiming.includes('DURING_REGISTRATION')) {
          const duringReqs = submissionRequirements.filter(
            (r) => (r.timing || 'DURING_REGISTRATION') === 'DURING_REGISTRATION'
          );
          if (duringReqs.length === 0) {
            setError('Please add at least one required field for "During Registration" deliverables.');
            return null;
          }
          if (duringReqs.some((r) => !r.label.trim())) {
            setError('Please enter a field label for all "During Registration" deliverables.');
            return null;
          }
        }

        if (submissionTiming.includes('AFTER_REGISTRATION')) {
          const afterReqs = submissionRequirements.filter((r) => r.timing === 'AFTER_REGISTRATION');
          if (afterReqs.length === 0) {
            setError('Please add at least one required field for "After Registration" deliverables.');
            return null;
          }
          if (afterReqs.some((r) => !r.label.trim())) {
            setError('Please enter a field label for all "After Registration" deliverables.');
            return null;
          }
        }
      }

      const sanitizedQuestions = (customQuestions || []).map(q => {
        if (q.type === 'radio' || q.type === 'checkbox') {
          return {
            ...q,
            options: (q.options || []).map((s: string) => s.trim()).filter(Boolean),
          };
        }
        return q;
      });

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
        status: (status as EventStatus) || (initialData?.status as EventStatus) || 'DRAFT',
        customQuestions: sanitizedQuestions,
        requireSubmission,
        submissionTiming,
        submissionInstructions: duringSubmissionInstructions || afterSubmissionInstructions || null,
        duringSubmissionInstructions: duringSubmissionInstructions || null,
        afterSubmissionInstructions: afterSubmissionInstructions || null,
        submissionDeadline: submissionDeadline ? new Date(submissionDeadline).toISOString() : null,
        submissionRequirements: submissionRequirements.length > 0 ? submissionRequirements : [],
      });

      return validated;
    } catch (err: any) {
      if (err.errors && err.errors[0]?.message) {
        setError(err.errors[0].message);
      } else {
        setError(err.message || 'Validation error');
      }
      return null;
    }
  };

  const handleOpenPreview = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const payload = validateForm();
    if (payload) {
      setValidatedPayload(payload);
      setShowPreviewModal(true);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleConfirmSubmit = async () => {
    if (!validatedPayload) return;
    if (!status) {
      setError('Please select an event status before saving.');
      return;
    }
    try {
      if (showNewMegaEventInput && newMegaEventName.trim() && !isMockMode) {
        const generatedId = newMegaEventName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
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
      await onSubmit({ ...validatedPayload, status } as any);
      setShowPreviewModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save event');
      setShowPreviewModal(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleOpenPreview();
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
        <h3 className="text-sm font-bold font-display text-kaziranga-900 dark:text-cream-100 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-kaziranga-600 dark:text-kaziranga-400" />
          <span>Mega Event Details</span>
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-200">
                Parent Event <span className="text-rose-500">*</span>
              </label>
              {!showNewMegaEventInput ? (
                <button type="button" onClick={() => setShowNewMegaEventInput(true)} className="text-[10px] font-bold text-kaziranga-600 dark:text-gold-400 hover:underline">
                  + New Mega Event
                </button>
              ) : (
                <button type="button" onClick={() => setShowNewMegaEventInput(false)} className="text-[10px] font-bold text-rose-500 hover:underline">
                  Cancel
                </button>
              )}
            </div>
            
            {!showNewMegaEventInput ? (
              <select
                required
                value={mainEventId}
                onChange={(e) => setMainEventId(e.target.value)}
                className="arena-select"
              >
                <option value="" disabled>Select a Mega Event...</option>
                {eventGroups.map((group) => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            ) : (
              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-200 mb-1">Mega Event Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newMegaEventName}
                    onChange={(e) => setNewMegaEventName(e.target.value)}
                    placeholder="Enter new mega event name..."
                    className="arena-input"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-200">
                      Description
                    </label>
                    <span className={`text-[11px] font-mono font-bold ${newMegaEventDescription.length >= 215 ? 'text-rose-500' : 'text-kaziranga-500 dark:text-cream-400/60'}`}>
                      {newMegaEventDescription.length}/215
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    maxLength={215}
                    value={newMegaEventDescription}
                    onChange={(e) => setNewMegaEventDescription(e.target.value)}
                    placeholder="Short description of this mega event collection (max 215 chars)..."
                    className="arena-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-200 mb-1">Cover Image URL</label>
                  <input
                    type="url"
                    value={newMegaEventCoverImage}
                    onChange={(e) => setNewMegaEventCoverImage(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="arena-input"
                  />
                </div>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-200 mb-2">
              Categories <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap gap-3">
              {['Technical', 'Cultural', 'Sports', 'Other'].map(cat => (
                <label key={cat} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={category.includes(cat)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCategory([...category, cat]);
                      } else {
                        if (category.length > 1) {
                          setCategory(category.filter(c => c !== cat));
                        }
                      }
                    }}
                    className="text-kaziranga-600 focus:ring-kaziranga-600 rounded"
                  />
                  <span className="text-xs text-kaziranga-800 dark:text-cream-200">{cat}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Basic Event Information */}
      <div className="space-y-4 pt-4 border-t border-cream-400/20 dark:border-kaziranga-800">
        <h3 className="text-sm font-bold font-display text-kaziranga-900 dark:text-cream-100 uppercase tracking-wider">
          General Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-200 mb-1">
              Event Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hackathon"
              className={`arena-input ${nameError ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
            />
            {isCheckingName ? (
              <p className="text-[11px] text-kaziranga-500 dark:text-cream-400/60 mt-1 flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full border-2 border-kaziranga-600 dark:border-gold-400 border-t-transparent animate-spin" />
                Checking title availability...
              </p>
            ) : nameError ? (
              <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {nameError}
              </p>
            ) : name.trim() ? (
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Event title is unique & available
              </p>
            ) : null}
          </div>
          
          <div>
            <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-200 mb-1">
              URL Slug <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kaziranga-500 dark:text-cream-400/50" />
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="hackathon"
                className={`arena-input pl-9 font-mono ${slugError ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
              />
            </div>
            {isCheckingSlug ? (
              <p className="text-[11px] text-kaziranga-500 dark:text-cream-400/60 mt-1 flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full border-2 border-kaziranga-600 dark:border-gold-400 border-t-transparent animate-spin" />
                Checking URL slug availability...
              </p>
            ) : slugError ? (
              <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {slugError}
              </p>
            ) : slug.trim() ? (
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                URL slug is unique & available
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-200 mb-1">
            Description <span className="text-rose-500">*</span>
          </label>
          <div id="event-description-container" className="bg-cream-50 dark:bg-kaziranga-900 rounded-xl overflow-visible border border-cream-400 dark:border-kaziranga-700 relative z-20 w-full max-w-full">
            <ReactQuill
              theme="snow"
              value={description}
              onChange={setDescription}
              modules={quillModules}
              formats={quillFormats}
              bounds="#event-description-container"
              className="text-rhino-black dark:text-cream-100 w-full max-w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-200 mb-1">
              Display Order Position <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kaziranga-500 dark:text-cream-400/50" />
              <input
                type="number"
                min={1}
                step={1}
                required
                value={displayOrder}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || parseInt(val, 10) >= 1) {
                    setDisplayOrder(val);
                  }
                }}
                placeholder="e.g. 1"
                className={`arena-input pl-9 font-mono ${orderError ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
              />
            </div>
            {isCheckingOrder ? (
              <p className="text-[11px] text-kaziranga-500 dark:text-cream-400/60 mt-1 flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full border-2 border-kaziranga-600 dark:border-gold-400 border-t-transparent animate-spin" />
                Checking order position...
              </p>
            ) : orderError ? (
              <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {orderError}
              </p>
            ) : displayOrder && parseInt(displayOrder, 10) >= 1 ? (
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Position #{displayOrder} is available (appears #{displayOrder} on event page)
              </p>
            ) : (
              <p className="text-[10px] text-kaziranga-600 dark:text-cream-400/60 mt-1">
                Controls card sequence on the event page. Position 1 appears first, 2 appears second, etc.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-200 mb-1">
              Platform/Venue <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. Google Meet"
              className="arena-input"
            />
          </div>
        </div>
      </div>

      {/* Schedule & Deadlines */}
      <div className="space-y-4 pt-4 border-t border-cream-400/20 dark:border-kaziranga-800">
        <h3 className="text-sm font-bold font-display text-kaziranga-900 dark:text-cream-100 uppercase tracking-wider">
          Schedule & Limits
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-200 mb-1">
              Start Date & Time <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
              className="arena-input text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-200 mb-1">
              End Date & Time <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
              className="arena-input text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-200 mb-1">
              Registration Deadline <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={registrationDeadline}
              onChange={(e) => setRegistrationDeadline(e.target.value)}
              className="arena-input text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-200 mb-1">
              Registration Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={registrationType}
              onChange={(e) => setRegistrationType(e.target.value as RegistrationType)}
              className="arena-select"
            >
              <option value="INDIVIDUAL">Individual Participation</option>
              <option value="TEAM">Team Participation</option>
            </select>
          </div>

          {registrationType === 'TEAM' ? (
            <div>
              <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-200 mb-1">
                Max Team Size <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="2"
                required
                value={maximumTeamSize}
                onChange={(e) => setMaximumTeamSize(e.target.value)}
                placeholder="e.g. 4 members"
                className="arena-input"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-200 mb-1">
                Max Participants (Optional)
              </label>
              <input
                type="number"
                min="1"
                value={maximumParticipants}
                onChange={(e) => setMaximumParticipants(e.target.value)}
                placeholder="Leave blank for unlimited"
                className="arena-input"
              />
            </div>
          )}
        </div>

        {registrationType === 'TEAM' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-200 mb-1">
                Max Teams (Optional)
              </label>
              <input
                type="number"
                min="1"
                value={maximumParticipants}
                onChange={(e) => setMaximumParticipants(e.target.value)}
                placeholder="Leave blank for unlimited"
                className="arena-input"
              />
            </div>
          </div>
        )}
      </div>

      {/* Media & Links */}
      <div className="space-y-4 pt-4 border-t border-cream-400/20 dark:border-kaziranga-800">
        <h3 className="text-sm font-bold font-display text-kaziranga-900 dark:text-cream-100 uppercase tracking-wider">
          Media & Rulebook
        </h3>

        <div>
          <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-200 mb-1">
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
          <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-200 mb-1">
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
      </div>

      {/* Submissions Configuration */}
      <div className="space-y-4 pt-4 border-t border-cream-400/20 dark:border-kaziranga-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold font-display text-kaziranga-900 dark:text-cream-100 uppercase tracking-wider">
              Submissions
            </h3>
            <p className="text-[10px] text-kaziranga-600 dark:text-cream-400/60 mt-0.5">
              Collect links, files, or written responses from participants.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={requireSubmission}
              onChange={(e) => handleToggleRequireSubmission(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-cream-300 peer-focus:outline-none rounded-full peer dark:bg-kaziranga-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-cream-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-kaziranga-600 peer-checked:bg-kaziranga-700 dark:peer-checked:bg-gold-500"></div>
          </label>
        </div>

        {requireSubmission && (
          <div className="p-4 bg-cream-200/40 dark:bg-kaziranga-900/50 rounded-xl border border-cream-400/30 dark:border-kaziranga-800 space-y-5 animate-in fade-in duration-200">
            {/* Timing Toggle (During vs After Registration) */}
            <div>
              <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-200 mb-2">
                Submission Timing <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                    submissionTiming.includes('DURING_REGISTRATION')
                      ? 'border-kaziranga-600 bg-cream-100 dark:bg-kaziranga-800/90 ring-2 ring-kaziranga-600/20'
                      : 'border-cream-400/30 dark:border-kaziranga-800 hover:bg-cream-100/50 dark:hover:bg-kaziranga-800/40'
                  }`}
                >
                  <input
                    type="checkbox"
                    name="submissionTiming"
                    value="DURING_REGISTRATION"
                    checked={submissionTiming.includes('DURING_REGISTRATION')}
                    onChange={(e) => handleToggleDuringReg(e.target.checked)}
                    className="mt-1 text-kaziranga-600 focus:ring-kaziranga-600 rounded"
                  />
                  <div>
                    <div className="text-xs font-bold font-display text-kaziranga-900 dark:text-cream-100">
                      During Registration
                    </div>
                    <div className="text-[10px] text-kaziranga-600 dark:text-cream-400/60 mt-0.5 leading-relaxed">
                      Collected directly inside the registration popup.
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                    submissionTiming.includes('AFTER_REGISTRATION')
                      ? 'border-kaziranga-600 bg-cream-100 dark:bg-kaziranga-800/90 ring-2 ring-kaziranga-600/20'
                      : 'border-cream-400/30 dark:border-kaziranga-800 hover:bg-cream-100/50 dark:hover:bg-kaziranga-800/40'
                  }`}
                >
                  <input
                    type="checkbox"
                    name="submissionTiming"
                    value="AFTER_REGISTRATION"
                    checked={submissionTiming.includes('AFTER_REGISTRATION')}
                    onChange={(e) => handleToggleAfterReg(e.target.checked)}
                    className="mt-1 text-kaziranga-600 focus:ring-kaziranga-600 rounded"
                  />
                  <div>
                    <div className="text-xs font-bold font-display text-kaziranga-900 dark:text-cream-100">
                      After Registration
                    </div>
                    <div className="text-[10px] text-kaziranga-600 dark:text-cream-400/60 mt-0.5 leading-relaxed">
                      Submitted or updated via participant dashboard.
                    </div>
                  </div>
                </label>
              </div>

              {submissionTiming.length === 0 && (
                <p className="text-xs text-rose-500 font-semibold mt-2">
                  Please select at least one collection timing (During Registration, After Registration, or both).
                </p>
              )}
            </div>

            {/* Section 1: During Registration Deliverables */}
            {submissionTiming.includes('DURING_REGISTRATION') && (() => {
              const duringReqs = submissionRequirements.filter(r => (r.timing || 'DURING_REGISTRATION') === 'DURING_REGISTRATION');
              return (
                <div className="p-4 rounded-xl bg-cream-100/70 dark:bg-kaziranga-950/60 border border-kaziranga-600/30 dark:border-kaziranga-700/60 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-cream-300/40 dark:border-kaziranga-800">
                    <div>
                      <h4 className="text-xs font-bold font-display text-kaziranga-900 dark:text-cream-100 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-kaziranga-600 dark:text-cream-300" />
                        <span>During Registration</span>
                      </h4>
                      <p className="text-[10px] text-kaziranga-600 dark:text-cream-400/60">
                        Collected directly inside the registration popup.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAddSubmissionReq('DURING_REGISTRATION')}
                      leftIcon={<Plus className="w-3 h-3" />}
                    >
                      Add Field
                    </Button>
                  </div>

                  {/* Deadline indicator banner */}
                  <div className="p-2.5 rounded-lg bg-cream-200/50 dark:bg-kaziranga-800/40 border border-cream-300/40 dark:border-kaziranga-700/40 text-[11px] text-kaziranga-700 dark:text-cream-300 flex items-center justify-between">
                    <span className="font-semibold">Deadline:</span>
                    <span className="font-mono text-kaziranga-800 dark:text-cream-100 font-bold">
                      Registration Deadline {registrationDeadline ? `(${new Date(registrationDeadline).toLocaleString()})` : ''}
                    </span>
                  </div>

                  {/* Field List for During Registration */}
                  <div className="space-y-2.5">
                    {duringReqs.map((req) => (
                      <div key={req.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3 bg-white/70 dark:bg-kaziranga-900/60 rounded-xl border border-cream-400/30 dark:border-kaziranga-800 relative group">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-kaziranga-700 dark:text-cream-300 mb-1">
                            Field Label <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={req.label}
                            onChange={(e) => updateSubmissionReq(req.id, 'label', e.target.value)}
                            placeholder={req.type === 'LINK' ? 'e.g. GitHub Repo, Figma Design, Drive Link, Demo Video' : 'e.g. Project Abstract, Solution Summary, Team Bio'}
                            className="arena-input text-xs py-1.5"
                          />
                        </div>
                        <div className="sm:w-44">
                          <label className="block text-[10px] font-bold text-kaziranga-700 dark:text-cream-300 mb-1">
                            Format
                          </label>
                          <select
                            value={req.type}
                            onChange={(e) => updateSubmissionReq(req.id, 'type', e.target.value)}
                            className="arena-select text-xs py-1.5"
                          >
                            <option value="LINK">URL Link</option>
                            <option value="TEXT">Text Notes</option>
                          </select>
                        </div>
                        {duringReqs.length > 1 && (
                          <div className="sm:pt-4 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveSubmissionReq(req.id)}
                              className="p-1.5 text-rose-400 hover:text-rose-600 transition-colors bg-cream-200/50 dark:bg-black/20 rounded-md"
                              title="Delete field"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {duringReqs.length === 0 && (
                      <div className="text-xs text-kaziranga-500 italic p-3 text-center border border-dashed border-cream-400/50 dark:border-kaziranga-800 rounded-xl">
                        No fields added for During Registration. Click "+ Add Field" above to add deliverables.
                      </div>
                    )}
                  </div>

                  {/* Submission Instructions for During Registration */}
                  <div className="pt-2 border-t border-cream-300/30 dark:border-kaziranga-800">
                    <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-200 mb-1">
                      Instructions & Guidelines
                    </label>
                    <textarea
                      rows={2}
                      value={duringSubmissionInstructions}
                      onChange={(e) => setDuringSubmissionInstructions(e.target.value)}
                      placeholder='e.g. Ensure sharing permissions are set to "Anyone with the link can view".'
                      className="arena-input text-xs"
                    />
                  </div>
                </div>
              );
            })()}

            {/* Section 2: After Registration Deliverables */}
            {submissionTiming.includes('AFTER_REGISTRATION') && (() => {
              const afterReqs = submissionRequirements.filter(r => r.timing === 'AFTER_REGISTRATION');
              return (
                <div className="p-4 rounded-xl bg-cream-100/70 dark:bg-kaziranga-950/60 border border-kaziranga-600/30 dark:border-kaziranga-700/60 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-cream-300/40 dark:border-kaziranga-800">
                    <div>
                      <h4 className="text-xs font-bold font-display text-kaziranga-900 dark:text-cream-100 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-kaziranga-600 dark:text-cream-300" />
                        <span>After Registration</span>
                      </h4>
                      <p className="text-[10px] text-kaziranga-600 dark:text-cream-400/60">
                        Submitted or updated via participant dashboard.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAddSubmissionReq('AFTER_REGISTRATION')}
                      leftIcon={<Plus className="w-3 h-3" />}
                    >
                      Add Field
                    </Button>
                  </div>

                  {/* Submission Deadline Picker */}
                  <div>
                    <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-200 mb-1">
                      Submission Deadline
                    </label>
                    <input
                      type="datetime-local"
                      value={submissionDeadline}
                      onChange={(e) => setSubmissionDeadline(e.target.value)}
                      className="arena-input text-xs"
                    />
                    <span className="text-[10px] text-kaziranga-500 dark:text-cream-400/50">
                      Defaults to event start date ({startDateTime ? new Date(startDateTime).toLocaleString() : 'event start date'}) if left blank.
                    </span>
                  </div>

                  {/* Field List for After Registration */}
                  <div className="space-y-2.5 pt-1">
                    {afterReqs.map((req) => (
                      <div key={req.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3 bg-white/70 dark:bg-kaziranga-900/60 rounded-xl border border-cream-400/30 dark:border-kaziranga-800 relative group">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-kaziranga-700 dark:text-cream-300 mb-1">
                            Field Label <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={req.label}
                            onChange={(e) => updateSubmissionReq(req.id, 'label', e.target.value)}
                            placeholder={req.type === 'LINK' ? 'e.g. Final GitHub Repo, Deployment URL, Figma Link' : 'e.g. Final Report Summary, Submission Notes, Change Log'}
                            className="arena-input text-xs py-1.5"
                          />
                        </div>
                        <div className="sm:w-44">
                          <label className="block text-[10px] font-bold text-kaziranga-700 dark:text-cream-300 mb-1">
                            Format
                          </label>
                          <select
                            value={req.type}
                            onChange={(e) => updateSubmissionReq(req.id, 'type', e.target.value)}
                            className="arena-select text-xs py-1.5"
                          >
                            <option value="LINK">URL Link</option>
                            <option value="TEXT">Text Notes</option>
                          </select>
                        </div>
                        {afterReqs.length > 1 && (
                          <div className="sm:pt-4 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveSubmissionReq(req.id)}
                              className="p-1.5 text-rose-400 hover:text-rose-600 transition-colors bg-cream-200/50 dark:bg-black/20 rounded-md"
                              title="Delete field"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {afterReqs.length === 0 && (
                      <div className="text-xs text-kaziranga-500 italic p-3 text-center border border-dashed border-cream-400/50 dark:border-kaziranga-800 rounded-xl">
                        No fields added for After Registration. Click "+ Add Field" above to add deliverables.
                      </div>
                    )}
                  </div>

                  {/* Submission Instructions for After Registration */}
                  <div className="pt-2 border-t border-cream-300/30 dark:border-kaziranga-800">
                    <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-200 mb-1">
                      Instructions & Guidelines
                    </label>
                    <textarea
                      rows={2}
                      value={afterSubmissionInstructions}
                      onChange={(e) => setAfterSubmissionInstructions(e.target.value)}
                      placeholder="e.g. Submit public repositories or demo links before the deadline."
                      className="arena-input text-xs"
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Custom Questions Builder */}
      <div className="space-y-4 pt-4 border-t border-cream-400/20 dark:border-kaziranga-800">
        <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
          <div>
            <h3 className="text-sm font-bold font-display text-kaziranga-900 dark:text-cream-100 uppercase tracking-wider">
              Registration Form Questions
            </h3>
            <p className="text-[10px] text-kaziranga-600 dark:text-cream-400/60 mt-0.5">Add custom fields for participants to answer during registration.</p>
            <div className="mt-2 text-[11px] text-kaziranga-800 dark:text-cream-200 bg-cream-200/50 dark:bg-kaziranga-900/60 px-3 py-2 rounded-lg border border-cream-400/30 dark:border-kaziranga-800">
              <span className="font-bold text-kaziranga-900 dark:text-cream-100">Default fields automatically included:</span> Name, Email, Phone Number, Region, Level, and Programme. You do not need to add these again.
            </div>
          </div>
          <Button type="button" size="sm" variant="secondary" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={handleAddQuestion} className="shrink-0">
            Add Question
          </Button>
        </div>

        {customQuestions.map((q, idx) => (
          <div key={q.id} className="p-4 bg-cream-200/30 dark:bg-kaziranga-900/40 rounded-xl border border-cream-400/20 dark:border-kaziranga-800 space-y-3 relative group">
            <button
              type="button"
              onClick={() => handleRemoveQuestion(q.id)}
              className="absolute top-3 right-3 p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pr-10">
              <div className="sm:col-span-6">
                <label className="block text-[11px] font-bold text-kaziranga-700 dark:text-cream-300 uppercase tracking-wider mb-1">
                  Question Text <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={q.question}
                  onChange={(e) => updateQuestion(q.id, 'question', e.target.value)}
                  placeholder="e.g. What is your team name?"
                  className="arena-input text-xs"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-bold text-kaziranga-700 dark:text-cream-300 uppercase tracking-wider mb-1">
                  Answer Type
                </label>
                <select
                  value={q.type}
                  onChange={(e) => updateQuestion(q.id, 'type', e.target.value)}
                  className="arena-select text-xs py-2"
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
                    className="w-4 h-4 rounded border-cream-400 text-kaziranga-700 focus:ring-kaziranga-700 bg-cream-50 dark:bg-kaziranga-900"
                  />
                  <span className="text-xs font-bold text-kaziranga-800 dark:text-cream-200">Required</span>
                </label>
              </div>
            </div>

            {(q.type === 'radio' || q.type === 'checkbox') && (
              <div className="pt-3 border-t border-cream-400/20 dark:border-kaziranga-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-kaziranga-700 dark:text-cream-300 uppercase tracking-wider">
                    Options / Choices <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddOption(q.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-kaziranga-700 dark:text-gold-400 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Option</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {(!q.options || q.options.length === 0 ? [''] : q.options).map((opt: string, optIdx: number) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <span className="w-5 text-center text-xs font-mono text-kaziranga-500 dark:text-cream-400/60 shrink-0">
                        {optIdx + 1}.
                      </span>
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => handleUpdateOption(q.id, optIdx, e.target.value)}
                        placeholder={`Option ${optIdx + 1}`}
                        className="arena-input text-xs py-1.5 flex-1"
                      />
                      {q.options && q.options.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(q.id, optIdx)}
                          className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg shrink-0 transition-colors"
                          title="Delete option"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {customQuestions.length === 0 && (
          <div className="text-xs text-kaziranga-500 dark:text-cream-400/50 italic p-4 text-center border border-dashed border-cream-400/40 dark:border-kaziranga-800 rounded-xl">
            No custom questions added.
          </div>
        )}
      </div>

      {/* Bottom Form Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-cream-400/20 dark:border-kaziranga-800">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
            isLoading={isLoading}
          >
            Review & Save
          </Button>
        </div>
      </div>

      {/* Live Event Preview Modal */}
      {showPreviewModal && validatedPayload && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Full Screen Blur Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
            onClick={() => setShowPreviewModal(false)}
          />

          {/* Modal Dialog */}
          <div className="relative z-10 bg-cream-50 dark:bg-kaziranga-950 border border-cream-400 dark:border-kaziranga-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-cream-400/30 dark:border-kaziranga-800 flex items-center justify-between bg-cream-100/70 dark:bg-kaziranga-900/80 backdrop-blur-sm shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-kaziranga-700 text-cream-100 dark:bg-gold-400 dark:text-kaziranga-950 shadow-sm">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold font-display text-kaziranga-900 dark:text-cream-50">
                    Live Event Preview
                  </h2>
                  <p className="text-xs text-kaziranga-600 dark:text-cream-400/70">
                    This is how the activity page will look to participants and house members.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <EventStatusBadge status={validatedPayload.status} registrationDeadline={validatedPayload.registrationDeadline} />
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1.5 text-kaziranga-500 hover:text-kaziranga-900 dark:text-cream-400 hover:dark:text-cream-100 hover:bg-cream-200 dark:hover:bg-kaziranga-800 rounded-xl transition-colors cursor-pointer"
                  title="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
              
              {showNewMegaEventInput && newMegaEventName.trim() && (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold font-display text-kaziranga-600 dark:text-gold-400 uppercase tracking-widest pl-1">
                    New Mega Event Preview
                  </h3>
                  <div className="relative rounded-2xl overflow-hidden bg-kaziranga-900 shadow-md h-32 sm:h-40 border-2 border-gold-500/30">
                    <img
                      src={getOptimizedImageUrl(newMegaEventCoverImage) || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80'}
                      alt={newMegaEventName}
                      className="w-full h-full object-cover opacity-60 mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-kaziranga-950 via-kaziranga-900/60 to-transparent" />
                    <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-end">
                      <div className="inline-flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-md bg-gold-500/20 text-gold-400 border border-gold-500/30 text-[9px] font-bold uppercase tracking-wider font-display">
                          Mega Event Collection
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-2xl font-black font-display text-cream-50 leading-tight">
                        {newMegaEventName}
                      </h2>
                      {newMegaEventDescription && (
                        <p className="text-xs text-cream-200/70 mt-1 line-clamp-1">{newMegaEventDescription}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-center -my-2 relative z-10">
                    <div className="bg-cream-200 dark:bg-kaziranga-800 rounded-full p-1 border border-cream-400/30 dark:border-kaziranga-700 shadow-sm">
                      <LinkIcon className="w-4 h-4 text-kaziranga-500 dark:text-cream-400" />
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Event Preview Header */}
              {showNewMegaEventInput && newMegaEventName.trim() && (
                <h3 className="text-[10px] font-bold font-display text-kaziranga-600 dark:text-cream-400/70 uppercase tracking-widest pl-1 mt-6">
                  Sub-Event Preview
                </h3>
              )}

              {/* Hero Banner */}
              <div className="relative rounded-2xl overflow-hidden bg-kaziranga-900 border border-cream-400/20 dark:border-kaziranga-800 shadow-lg h-56 sm:h-72">
                <img
                  src={getOptimizedImageUrl(validatedPayload.coverImageUrl) || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80'}
                  alt={validatedPayload.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-kaziranga-950 via-kaziranga-950/60 to-transparent" />

                <div className="absolute bottom-5 left-5 right-5 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-kaziranga-800/90 backdrop-blur-sm text-cream-200 text-xs font-bold border border-kaziranga-700/40 font-display">
                      {Array.isArray(validatedPayload.category) ? validatedPayload.category.join(', ') : validatedPayload.category}
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-kaziranga-900/80 backdrop-blur-sm text-gold-400 text-xs font-bold border border-gold-500/30">
                      Position #{validatedPayload.displayOrder}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-3xl font-display font-black text-cream-50 leading-tight">
                    {validatedPayload.name}
                  </h1>
                  <p className="text-xs text-cream-300/80 font-mono">
                    URL: /events/{validatedPayload.mainEventId}/subevents/{validatedPayload.slug}
                  </p>
                </div>
              </div>

              {/* 2-Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left 2 Cols: Main Information */}
                <div className="md:col-span-2 space-y-6">
                  {/* Description Box */}
                  <Card className="p-5 space-y-3">
                    <h3 className="text-sm font-bold font-display text-kaziranga-900 dark:text-cream-100 uppercase tracking-wider">
                      About the Activity
                    </h3>
                    <div 
                      className="text-xs sm:text-sm text-kaziranga-800 dark:text-cream-200 leading-relaxed break-words overflow-x-auto prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: validatedPayload.description }}
                    />

                    {validatedPayload.rulebookUrl && (
                      <div className="pt-3 border-t border-cream-400/20 dark:border-kaziranga-800">
                        <a
                          href={validatedPayload.rulebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cream-200/60 dark:bg-kaziranga-900/60 text-kaziranga-800 dark:text-cream-100 text-xs font-bold hover:bg-cream-300/60 dark:hover:bg-kaziranga-800 transition-colors border border-cream-400/30 dark:border-kaziranga-800"
                        >
                          <FileText className="w-3.5 h-3.5 text-kaziranga-600 dark:text-kaziranga-400" />
                          <span>Official Rulebook PDF</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </Card>

                  {/* Project Deliverable / Submission Preview */}
                  {validatedPayload.requireSubmission && (
                    <Card className="p-5 space-y-3 border-emerald-500/30 dark:border-emerald-600/30 bg-emerald-50/40 dark:bg-emerald-950/20">
                      <div className="flex items-center gap-2">
                        <UploadCloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <h3 className="text-sm font-bold font-display text-emerald-900 dark:text-emerald-200">
                          Project Submission Required ({validatedPayload.submissionType === 'LINK' ? 'URL Link' : 'Text Solution'})
                        </h3>
                      </div>
                      <p className="text-xs text-kaziranga-700 dark:text-cream-300/90 leading-relaxed">
                        {validatedPayload.submissionInstructions || 'Participants must submit their project deliverables according to event guidelines.'}
                      </p>
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                        Timing: {validatedPayload.submissionTiming === 'DURING_REGISTRATION' ? 'Collected During Registration Form' : 'Submitted on "My Registrations" portal after registering'}
                      </div>
                    </Card>
                  )}

                  {/* Custom Registration Questions Preview */}
                  {validatedPayload.customQuestions && validatedPayload.customQuestions.length > 0 && (
                    <Card className="p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold font-display text-kaziranga-900 dark:text-cream-100 uppercase tracking-wider">
                          Registration Form Questions ({validatedPayload.customQuestions.length})
                        </h3>
                        <span className="text-[11px] text-kaziranga-500 dark:text-cream-400/60 italic">Preview Mode</span>
                      </div>

                      <div className="space-y-3.5">
                        {validatedPayload.customQuestions.map((q: any, qIdx: number) => (
                          <div key={q.id || qIdx} className="p-3.5 rounded-xl bg-cream-100/50 dark:bg-kaziranga-900/40 border border-cream-400/30 dark:border-kaziranga-800/80 space-y-2">
                            <label className="block text-xs font-bold text-kaziranga-900 dark:text-cream-100">
                              {qIdx + 1}. {q.question} {q.required && <span className="text-rose-500">*</span>}
                            </label>

                            {q.type === 'text' && (
                              <input
                                type="text"
                                disabled
                                placeholder="Student answer text..."
                                className="arena-input text-xs py-1.5 opacity-80 cursor-not-allowed"
                              />
                            )}

                            {q.type === 'textarea' && (
                              <textarea
                                disabled
                                rows={2}
                                placeholder="Student paragraph response..."
                                className="arena-input text-xs py-1.5 opacity-80 cursor-not-allowed resize-none"
                              />
                            )}

                            {q.type === 'radio' && (
                              <div className="space-y-1.5 pl-1">
                                {(q.options || []).map((opt: string, optIdx: number) => (
                                  <label key={optIdx} className="flex items-center gap-2 text-xs text-kaziranga-800 dark:text-cream-200">
                                    <input type="radio" disabled name={`preview-q-${qIdx}`} className="text-kaziranga-700" />
                                    <span>{opt}</span>
                                  </label>
                                ))}
                              </div>
                            )}

                            {q.type === 'checkbox' && (
                              <div className="space-y-1.5 pl-1">
                                {(q.options || []).map((opt: string, optIdx: number) => (
                                  <label key={optIdx} className="flex items-center gap-2 text-xs text-kaziranga-800 dark:text-cream-200">
                                    <input type="checkbox" disabled className="rounded text-kaziranga-700" />
                                    <span>{opt}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>

                {/* Right 1 Col: Metadata Sidebar */}
                <div className="space-y-4">
                  <Card className="p-5 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-kaziranga-700 dark:text-cream-300 font-display">
                      Event Summary
                    </h3>

                    <div className="space-y-3 text-xs text-kaziranga-700 dark:text-cream-300/80">
                      <div className="flex items-start gap-2.5">
                        <Calendar className="w-4 h-4 text-kaziranga-500 dark:text-kaziranga-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-kaziranga-900 dark:text-cream-100">Starts</div>
                          <div>{new Date(validatedPayload.startDateTime).toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Clock className="w-4 h-4 text-kaziranga-500 dark:text-kaziranga-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-kaziranga-900 dark:text-cream-100">Ends</div>
                          <div>{new Date(validatedPayload.endDateTime).toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Clock className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-rose-600 dark:text-rose-400">Registration Deadline</div>
                          <div>{new Date(validatedPayload.registrationDeadline).toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-kaziranga-500 dark:text-kaziranga-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-kaziranga-900 dark:text-cream-100">Platform / Venue</div>
                          <div>{validatedPayload.venue}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Users className="w-4 h-4 text-kaziranga-500 dark:text-kaziranga-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-kaziranga-900 dark:text-cream-100">Registration Type</div>
                          <div>
                            {validatedPayload.registrationType === 'TEAM' 
                              ? `Team Event (Max ${validatedPayload.maximumTeamSize || 4} members)`
                              : 'Individual Registration'
                            }
                          </div>
                        </div>
                      </div>

                      {validatedPayload.maximumParticipants && (
                        <div className="flex items-start gap-2.5">
                          <Users className="w-4 h-4 text-kaziranga-500 dark:text-kaziranga-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-kaziranga-900 dark:text-cream-100">Participant Capacity</div>
                            <div>Max {validatedPayload.maximumParticipants} Participants</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Event Publication Status Card */}
                  <Card className="p-5 space-y-3 bg-cream-100/80 dark:bg-kaziranga-900/60 border border-cream-400/40 dark:border-kaziranga-700/60">
                    <div>
                      <label className="block text-xs font-bold text-kaziranga-900 dark:text-cream-100 uppercase tracking-wider mb-1">
                        Event Status <span className="text-rose-500">*</span>
                      </label>
                      <p className="text-[10px] text-kaziranga-600 dark:text-cream-400/60 mb-2">
                        Select the visibility status before saving.
                      </p>
                    </div>
                    <select
                      value={status}
                      onChange={(e) => {
                        const nextStatus = e.target.value as EventStatus;
                        setStatus(nextStatus);
                        if (validatedPayload) {
                          setValidatedPayload({ ...validatedPayload, status: nextStatus });
                        }
                      }}
                      className="arena-select text-xs font-medium"
                    >
                      <option value="" disabled>Select Event Status...</option>
                      <option value="DRAFT">DRAFT (Admins only)</option>
                      <option value="PUBLISHED">PUBLISHED (Open for users)</option>
                      <option value="CLOSED">CLOSED (Registration locked)</option>
                      <option value="COMPLETED">COMPLETED (Finished)</option>
                    </select>
                  </Card>
                </div>
              </div>
            </div>

            {/* Modal Sticky Footer */}
            <div className="p-4 sm:p-5 border-t border-cream-400/30 dark:border-kaziranga-800 flex flex-wrap items-center justify-between gap-3 bg-cream-100/70 dark:bg-kaziranga-900/80 backdrop-blur-sm shrink-0">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setShowPreviewModal(false)}
                disabled={isLoading}
              >
                Back to Edit Form
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleConfirmSubmit}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                isLoading={isLoading}
                disabled={isLoading || !status}
                className="ml-auto"
              >
                {initialData?.id ? 'Confirm & Update Event' : 'Confirm & Save Event'}
              </Button>
            </div>

          </div>
        </div>
      )}
    </form>
  );
};
