import { z } from 'zod';

export const userProfileSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^(\+\d{1,3}[- ]?)?\d{10}$/, {
      message: 'Please enter a valid 10-digit phone number (e.g. 9876543210 or +919876543210)',
    })
    .or(z.literal('')),
  region: z.string().trim(),
  level: z.string().trim(),
  programme: z.string().trim(),
});

export const eventSchema = z.object({
  name: z.string().min(3, 'Event title must be at least 3 characters').max(120),
  mainEventId: z.string().min(1, 'Parent Event is required'),
  slug: z.string().min(2, 'Slug is required').max(120).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  customQuestions: z.array(
    z.object({
      id: z.string(),
      question: z.string().min(1, 'Question text is required'),
      type: z.enum(['text', 'textarea', 'radio', 'checkbox']),
      required: z.boolean(),
      options: z.array(z.string()).optional(),
    })
  ).optional().default([]),
  category: z.union([z.string(), z.array(z.string())]),
  displayOrder: z.number().int().optional(),
  startDateTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start date/time' }),
  endDateTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid end date/time' }),
  registrationDeadline: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid registration deadline' }),
  venue: z.string().min(2, 'Venue is required'),
  registrationType: z.enum(['INDIVIDUAL', 'TEAM']),
  maximumParticipants: z.number().nullable().optional(),
  maximumTeamSize: z.number().nullable().optional(),
  rulebookUrl: z.string().url('Must be a valid URL').nullable().or(z.literal('')).optional(),
  coverImageUrl: z.string().url('Must be a valid image URL').nullable().or(z.literal('')).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED', 'COMPLETED']),
  requireSubmission: z.boolean().optional().default(false),
  submissionTiming: z.union([z.enum(['DURING_REGISTRATION', 'AFTER_REGISTRATION']), z.array(z.enum(['DURING_REGISTRATION', 'AFTER_REGISTRATION']))]).optional().default('DURING_REGISTRATION'),
  submissionType: z.enum(['LINK', 'TEXT']).optional().default('LINK'),
  submissionInstructions: z.string().nullable().or(z.literal('')).optional(),
  submissionDeadline: z.string().nullable().or(z.literal('')).optional(),
  submissionContent: z.string().optional(),
  submissionRequirements: z.array(
    z.object({
      id: z.string(),
      label: z.string().min(1, 'Label is required'),
      type: z.enum(['LINK', 'TEXT']),
    })
  ).optional(),
});

export const registrationSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  phone: z
    .string()
    .trim()
    .regex(/^(\+\d{1,3}[- ]?)?\d{10}$/, { message: 'A valid 10-digit phone number is required for registration' }),
  region: z.string().min(1, 'Region is required'),
  level: z.string().min(1, 'Level is required'),
  programme: z.string().min(1, 'Programme is required'),
  submissionContent: z.string().optional(),
  submissionAnswers: z.record(z.string(), z.string()).optional(),
});

export const allowedUserEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Invalid email address')
  .refine((val) => val.endsWith('study.iitm.ac.in'), {
    message: 'Must be an official IITM study email ending with study.iitm.ac.in',
  });
