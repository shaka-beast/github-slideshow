import { z } from 'zod'

export const createCampaignSchema = z.object({
  title: z.string().min(5).max(120),
  story: z.string().min(20).max(8000),
  targetAmountKes: z.number().int().positive(),
  payoutMethod: z.enum(['mpesa', 'bank']),
  payoutDestination: z.string().min(6).max(64),
  scheduledPayoutDate: z.string().datetime(),
  deadline: z.string().datetime(),
  privacy: z.enum(['public', 'private']),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(9).max(20),
  coverPhotoUrl: z.string().url().optional(),
})

export const donationInitSchema = z.object({
  campaignId: z.string().uuid(),
  amountKes: z.number().int().positive(),
  method: z.enum(['mpesa', 'card_flutterwave', 'card_paystack']),
  donorName: z.string().min(1).max(120).optional(),
  donorEmail: z.string().email(),
  donorPhone: z.string().min(9).max(20),
  isAnonymous: z.boolean().default(false),
  coverFees: z.boolean().default(false),
})

