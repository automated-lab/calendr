'use server'

import prisma from '../lib/db'
import { requireUser } from '../lib/hooks'
import { parseWithZod } from '@conform-to/zod'
import { signIn, signOut } from '../lib/auth'
import { onBoardingSchemaValidation } from '../lib/zodSchemas'
import { redirect } from 'next/navigation'

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
          where: { username: formData.get('userName') as string },
        });
        return !existingUsername;
      },
    }),

    async: true,
  });

  if(submission.status !== 'success') {
    return submission.reply();
  }

   const data = await prisma.user.update({
      where: {
        id: session.user?.id,
      },
      data: {
        name: submission.value.fullName,
        username: submission.value.userName,
      }
    });
  return redirect('/dashboard');
} 
