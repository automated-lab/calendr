'use server'

import { signIn } from '@/app/lib/auth'

export async function handleGoogleSignIn() {
  await signIn("google")
}

export async function handleGithubSignIn() {
  await signIn("github")
}
