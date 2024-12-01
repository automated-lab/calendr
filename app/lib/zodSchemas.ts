import { z } from 'zod'

export const onboardingSchema = z.object({
    fullName: z.string().min(3, { message: 'Name must contain at least 3 characters' }).max(50, { message: 'Name must be less than 50 characters' }),
    userName: z.string().min(3, { message: 'Username must contain at least 3 characters' }).max(50, { message: 'Username must be less than 50 characters' }).regex(/^[a-zA-Z0-9-]+$/, { message: 'Username must contain only letters, numbers, and hyphens' }),
});

