"use server";

import { signIn } from './auth';

export async function handleGoogleSignIn() {
    try {
        await signIn("google");
        // Handle successful sign-in
    } catch (error) {
        console.error('Error signing in:', error);
        // Handle error
    }
} 