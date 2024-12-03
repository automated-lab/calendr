import { conformZodMessage } from '@conform-to/zod';
import { z } from 'zod'

export const onboardingSchema = z.object({
    fullName: z.string().min(3, { message: 'Name must contain at least 3 characters' }).max(50, { message: 'Name must be less than 50 characters' }),
    username: z.string().min(3, { message: 'Username must contain at least 3 characters' }).max(50, { message: 'Username must be less than 50 characters' }).regex(/^[a-zA-Z0-9-]+$/, { message: 'Username must contain only letters, numbers, and hyphens' }),
});

export function onBoardingSchemaValidation(options?: {
    isUsernameUnique: () => Promise<boolean>;
}) {
    return z.object({
        username: z.string().min(3, { message: 'Username must contain at least 3 characters' }).max(50, { message: 'Username must be less than 50 characters' }).regex(/^[a-zA-Z0-9-]+$/, { message: 'Username must contain only letters, numbers, and hyphens' }).pipe (
            z.string().superRefine((_,ctx) => {
                if(typeof options?.isUsernameUnique !== 'function') {
                    ctx.addIssue({
                        code: 'custom',
                        message: conformZodMessage.VALIDATION_UNDEFINED,
                        fatal: true,
                    });
                    return;
                }
                return options.isUsernameUnique().then((isUnique) => {
                    if(!isUnique) {
                        ctx.addIssue({
                            code: 'custom',
                            message: 'Username is already taken',
                        });
                    }
                });
            })
        ),
        fullName: z.string().min(3, { message: 'Name must contain at least 3 characters' }).max(50, { message: 'Name must be less than 50 characters' }),
    });
}

export const settingsSchema = z.object({
    fullName: z.string().min(3, { message: 'Name must contain at least 3 characters' }).max(50, { message: 'Name must be less than 50 characters' }),
    profileImage: z.string(),
});
