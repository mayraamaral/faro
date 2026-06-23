import { z } from 'zod';

export const AdoptionProcessStatusEnum = z.enum([
  'UNDER_REVIEW',
  'IN_PROGRESS',
  'VISIT_PENDING',
  'VISITED',
  'IN_ADAPTATION',
  'ADOPTED',
  'CANCELED',
  'REJECTED',
]);

export type AdoptionProcessStatus = z.infer<typeof AdoptionProcessStatusEnum>;

const isoDatetime = z.iso.datetime();
const uuid = z.uuid();

const baseAdoption = z.object({
  id: uuid.optional(),
  animalId: uuid,
  notes: z.string().nullable().optional(),
  createdAt: isoDatetime.optional(),
  updatedAt: isoDatetime.optional(),
});

export const adoptionSchema = z.discriminatedUnion('status', [
  baseAdoption.extend({
    status: z.literal('UNDER_REVIEW'),
    adopterProfileId: z.string().nullable().optional(),
  }),
  baseAdoption.extend({
    status: z.literal('IN_PROGRESS'),
    adopterProfileId: uuid,
  }),
  baseAdoption.extend({
    status: z.literal('VISIT_PENDING'),
    adopterProfileId: uuid,
    visitScheduledFor: isoDatetime,
  }),
  baseAdoption.extend({
    status: z.literal('VISITED'),
    adopterProfileId: uuid,
    visitScheduledFor: isoDatetime,
    visitedAt: isoDatetime,
  }),
  baseAdoption.extend({
    status: z.literal('IN_ADAPTATION'),
    adopterProfileId: uuid,
    visitScheduledFor: isoDatetime,
    visitedAt: isoDatetime,
    adaptationStartedAt: isoDatetime,
    adaptationEndedAt: isoDatetime.nullable().optional(),
  }),
  baseAdoption.extend({
    status: z.literal('ADOPTED'),
    adopterProfileId: uuid,
    visitScheduledFor: isoDatetime.nullable().optional(),
    visitedAt: isoDatetime.nullable().optional(),
    adaptationStartedAt: isoDatetime.nullable().optional(),
    adaptationEndedAt: isoDatetime.nullable().optional(),
    adoptionDate: isoDatetime,
  }),
  baseAdoption.extend({
    status: z.literal('CANCELED'),
    adopterProfileId: uuid.nullable().optional(),
    cancelReason: z.string().min(1),
    visitScheduledFor: isoDatetime.nullable().optional(),
    visitedAt: isoDatetime.nullable().optional(),
    adaptationStartedAt: isoDatetime.nullable().optional(),
    adaptationEndedAt: isoDatetime.nullable().optional(),
  }),
  baseAdoption.extend({
    status: z.literal('REJECTED'),
    adopterProfileId: uuid.nullable().optional(),
    cancelReason: z.string().min(1),
    decisionNotes: z.string().nullable().optional(),
    visitScheduledFor: isoDatetime.nullable().optional(),
    visitedAt: isoDatetime.nullable().optional(),
    adaptationStartedAt: isoDatetime.nullable().optional(),
    adaptationEndedAt: isoDatetime.nullable().optional(),
  }),
]);

export type AdoptionData = z.infer<typeof adoptionSchema>;

export const scheduleVisitSchema = z.object({
  adoptionId: uuid,
  visitScheduledFor: isoDatetime,
});

export const registerVisitSchema = z.object({
  adoptionId: uuid,
  visitedAt: isoDatetime,
});

export const startAdaptationSchema = z.object({
  adoptionId: uuid,
  adaptationStartedAt: isoDatetime,
});

export const finalizeAdoptionSchema = z.object({
  adoptionId: uuid,
  adoptionDate: isoDatetime,
  adopterProfileId: uuid,
});

export const cancelAdoptionSchema = z.object({
  adoptionId: uuid,
  cancelReason: z.string().min(1),
});

export const rejectAdoptionSchema = z.object({
  adoptionId: uuid,
  cancelReason: z.string().min(1),
  decisionNotes: z.string().nullable().optional(),
});
