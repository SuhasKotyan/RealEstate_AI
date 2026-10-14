import { z } from 'zod';

const text = (max) => z.string().trim().min(1).max(max);
export const intakeSchema = z.object({
  name: text(100),
  location: text(150),
  property: text(350),
  budget: text(150),
  timeline: text(150),
  message: text(8000),
});
export const scoreDefinitions = [
  { key: 'urgency', label: 'Buying timeline', max: 35 },
  { key: 'clarity', label: 'Requirement clarity', max: 25 },
  { key: 'intent', label: 'Purchase intent', max: 25 },
  { key: 'readiness', label: 'Next-step readiness', max: 15 },
];
const scorePart = (max) =>
  z.object({ points: z.number().int().min(0).max(max), reason: text(300) });
export const analysisSchema = z.object({
  summary: text(600),
  intent: text(250),
  requirements: z.array(text(250)).min(1).max(8),
  concerns: z.array(text(250)).max(6),
  missingInformation: z.array(text(250)).max(6),
  nextAction: text(400),
  suggestedResponse: text(1800),
  scores: z.object({
    urgency: scorePart(35),
    clarity: scorePart(25),
    intent: scorePart(25),
    readiness: scorePart(15),
  }),
  evidence: z
    .array(
      z.object({
        field: z.enum(['location', 'property', 'budget', 'timeline', 'message']),
        quote: text(400),
      }),
    )
    .min(1)
    .max(5),
});
export const chatOutputSchema = z.object({
  answer: text(3500),
  suggestedResponse: z.string().max(1800).nullable(),
  evidence: z
    .array(
      z.object({
        field: z.enum(['location', 'property', 'budget', 'timeline', 'message', 'activity']),
        quote: text(400),
      }),
    )
    .max(5),
});
export const activitySchema = z.object({
  id: text(100),
  at: z.iso.datetime(),
  type: z.enum(['note', 'status', 'followup', 'completed']),
  text: text(1800),
});
export const chatMessageSchema = z.object({
  id: text(100),
  role: z.enum(['user', 'assistant']),
  content: text(3500),
  at: z.iso.datetime(),
  evidence: chatOutputSchema.shape.evidence.optional(),
  suggestedResponse: z.string().max(1800).nullable().optional(),
});
export const leadSchema = z.object({
  id: text(100),
  intake: intakeSchema,
  analysis: analysisSchema.nullable(),
  source: z.enum(['sample', 'live', 'draft']),
  status: z.enum(['New', 'Contacted', 'Visit booked', 'Won', 'Lost']),
  createdAt: z.iso.datetime(),
  analyzedAt: z.iso.datetime().nullable(),
  model: z.string().max(100).nullable(),
  followup: z.object({ task: text(400), dueAt: z.iso.datetime(), done: z.boolean() }).nullable(),
  activity: z.array(activitySchema).max(200),
  chat: z.array(chatMessageSchema).max(100),
});
export const backupSchema = z
  .object({ version: z.literal(1), leads: z.array(leadSchema).max(500) })
  .superRefine((data, ctx) => {
    if (new Set(data.leads.map((l) => l.id)).size !== data.leads.length)
      ctx.addIssue({ code: 'custom', message: 'Duplicate lead IDs.' });
  });
export const analyzeRequestSchema = z.object({ intake: intakeSchema });
export const chatRequestSchema = z.object({
  intake: intakeSchema,
  analysis: analysisSchema.nullable(),
  activity: z.array(activitySchema).max(20),
  history: z.array(z.object({ role: z.enum(['user', 'assistant']), content: text(3500) })).max(12),
  question: text(1500),
});

export function getScore(analysis) {
  return analysis
    ? scoreDefinitions.reduce((sum, part) => sum + analysis.scores[part.key].points, 0)
    : null;
}
export function getPriority(analysis) {
  const score = getScore(analysis);
  return score === null ? 'Unscored' : score >= 75 ? 'Hot' : score >= 45 ? 'Warm' : 'Cold';
}
export function isOpen(lead) {
  return !['Won', 'Lost'].includes(lead.status);
}
export function isDue(lead, now = Date.now()) {
  return (
    isOpen(lead) &&
    !!lead.followup &&
    !lead.followup.done &&
    new Date(lead.followup.dueAt).getTime() <= now
  );
}
export function sortLeads(leads, order = 'priority', now = Date.now()) {
  return [...leads].sort((a, b) => {
    if (order === 'newest') return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    const open = Number(isOpen(b)) - Number(isOpen(a));
    if (open) return open;
    if (order === 'followup') {
      const due = Number(isDue(b, now)) - Number(isDue(a, now));
      if (due) return due;
      const aTime = a.followup && !a.followup.done ? Date.parse(a.followup.dueAt) : Infinity;
      const bTime = b.followup && !b.followup.done ? Date.parse(b.followup.dueAt) : Infinity;
      if (aTime !== bTime) return aTime - bTime;
    }
    return (
      (getScore(b.analysis) ?? -1) - (getScore(a.analysis) ?? -1) ||
      Date.parse(b.createdAt) - Date.parse(a.createdAt)
    );
  });
}
export function verifyEvidence(output, intake, activity = []) {
  const fields = { ...intake, activity: activity.map((a) => a.text).join('\n') };
  for (const item of output.evidence) {
    if (!fields[item.field]?.includes(item.quote))
      throw new Error('AI evidence did not match the original lead. Please retry.');
  }
  return output;
}
