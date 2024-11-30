import React from 'react'
import { Button } from '@/components/ui/button'
import { useFormStatus } from 'react-dom'
import Image from 'next/image';
import GoogleLogo from '@/public/google.svg'
import { Loader2 } from 'lucide-react'

export function GoogleAuthButton() {
    const { pending } = useFormStatus();
  
    return (
    <>
        {pending ? (
            <Button disabled variant='outline' className='w-full'>
                <Loader2 className='size-4 mr-2 animate-spin' />
                Signing in...
            </Button>
        ): (
            <Button variant='outline' className='w-full'>
                <Image src={GoogleLogo} alt='google' className='size-4 mr-2' />
                Sign in with Google
            </Button>
        )}
    </>
  )
}
