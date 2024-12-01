import React from 'react'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
} from '@/components/ui/dialog'
import { GithubAuthButton, GoogleAuthButton } from './SubmitButtons'

import Image from 'next/image'
import Logo from '@/public/logo.png'
import { handleGoogleSignIn, handleGithubSignIn } from '@/app/actions/auth'

export default function AuthModal() {
  return (
    <Dialog>
        <DialogTrigger asChild>
            <Button>Try for Free</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[360px]">
            <DialogTitle className="sr-only">Sign in to Calendr</DialogTitle>
            <DialogHeader className="flex flex-row items-center gap-2 justify-center">
                <Image src={Logo} alt="logo" className="size-10" />
                <h4 className="font-semibold text-xl">
                    Calend<span className="text-primary">r</span>
                </h4>
            </DialogHeader>
            <div className="flex flex-col my-5 gap-2">
                <form action={handleGoogleSignIn}>
                    <GoogleAuthButton />
                </form>
                <form action={handleGithubSignIn}>
                    <GithubAuthButton />
                </form>
            </div>
        </DialogContent>
    </Dialog>
  )
}
