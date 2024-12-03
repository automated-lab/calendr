'use server'

import prisma from '../lib/db'
import { requireUser } from '../lib/hooks'
import { parseWithZod } from '@conform-to/zod'
import { signIn, signOut } from '../lib/auth'
import { onBoardingSchemaValidation, settingsSchema } from '../lib/zodSchemas'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { auth } from '../lib/auth'

export async function handleGoogleSignIn() {
  await signIn("google")
}

export async function handleGithubSignIn() {
  await signIn("github")
}

export async function handleSignOut() {
  await signOut()
}

export async function OnboardingAction(
  previousState: unknown,
  formData: FormData
) {
  const session = await requireUser();
  const submission = await parseWithZod(formData, {
    schema: onBoardingSchemaValidation({
      async isUsernameUnique() {
        const existingUsername = await prisma.user.findUnique({
          where: { username: formData.get('username') as string },
        });
        return !existingUsername;
      },
    }),
    async: true,
  });

  if(submission.status !== 'success') {
    return submission.reply();
  }

  // Create a base date for today
  const baseDate = new Date().toISOString().split('T')[0];
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const data = await prisma.user.update({
    where: {
      id: session.user?.id,
    },
    data: {
      name: submission.value.fullName,
      username: submission.value.username,
      availability: {
        createMany: {
          data: [
            {
              day: "Monday",
              fromTime: new Date(`${baseDate}T09:00:00-00:00`),
              toTime: new Date(`${baseDate}T17:00:00-00:00`),
            },
            {
              day: "Tuesday",
              fromTime: new Date(`${baseDate}T09:00:00-00:00`),
              toTime: new Date(`${baseDate}T17:00:00-00:00`),
            },
            {
              day: "Wednesday",
              fromTime: new Date(`${baseDate}T09:00:00-00:00`),
              toTime: new Date(`${baseDate}T17:00:00-00:00`),
            },
            {
              day: "Thursday",
              fromTime: new Date(`${baseDate}T09:00:00-00:00`),
              toTime: new Date(`${baseDate}T17:00:00-00:00`),
            },
            {
              day: "Friday",
              fromTime: new Date(`${baseDate}T09:00:00-00:00`),
              toTime: new Date(`${baseDate}T17:00:00-00:00`),
            },
            {
              day: "Saturday",
              fromTime: new Date(`${baseDate}T09:00:00-00:00`),
              toTime: new Date(`${baseDate}T17:00:00-00:00`),
            },
            {
              day: "Sunday",
              fromTime: new Date(`${baseDate}T09:00:00-00:00`),
              toTime: new Date(`${baseDate}T17:00:00-00:00`),
            },
          ]
        }
      }
    }
  });
  return redirect('/onboarding/grant-id');
} 


export async function SettingsAction(
  previousState: unknown,
  formData: FormData
) {
  const session = await requireUser();
  const submission = parseWithZod(formData, {
    schema: settingsSchema,
  });

  if(submission.status !== 'success') {
    return submission.reply();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const user = await prisma.user.update({
    where: {
      id: session.user?.id,
    },
    data: {
      name: submission.value.fullName,
      image: submission.value.profileImage,
    }
  });
  return redirect('/dashboard');
}

export async function updateAvailabilityAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const updates = JSON.parse(formData.get('updates') as string);
  
  try {
    const availability = await prisma.availability.findUnique({
      where: {
        id: updates.id,
        userId: session.user.id
      }
    });

    if (!availability) {
      throw new Error('Availability record not found');
    }

    await prisma.availability.update({
      where: {
        id: updates.id,
      },
      data: {
        isActive: updates.isActive,
        fromTime: new Date(updates.fromTime),
        toTime: new Date(updates.toTime),
        userId: session.user.id
      }
    });
    
    revalidatePath('/dashboard/availability');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Update error:', error.message);
    } else {
      console.error('Unexpected error:', error);
    }
    throw new Error('Failed to update availability');
  }
}
