'use server'

import prisma from '../lib/db'
import { requireUser } from '../lib/hooks'
import { parseWithZod } from '@conform-to/zod'
import { onboardingSchema } from '../lib/zodSchemas'
import { signIn, signOut } from '../lib/auth'

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
  const submission = parseWithZod(formData, { schema: onboardingSchema });

  if(submission.status !== 'success') {
    return submission.reply();
  }

  if (submission.status === 'success') {
    await prisma.user.update({
      where: { id: session.user?.id },
      data: {
        name: submission.value.fullName,
        username: submission.value.userName,
      }
    })
  }
  return submission.reply();
} 
