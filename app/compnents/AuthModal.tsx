import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import React from 'react'
import { Button } from '@/components/ui/button'
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Image from 'next/image'
import Logo from '@/public/logo.png'

export default function AuthModal() {
  return (
    <Dialog>
        <DialogTrigger asChild>
            <Button>Try for Free</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[360px]">
            <DialogHeader className="flex flex-row items-center gap-2 justify-center">
                <Image src={Logo} alt="logo" className="size-10" />
                <h4 className="font-semibold text-xl">
                    Calend<span className="text-primary">r</span>
                </h4>
            </DialogHeader>
            <div className="flex flex-col my-5 gap-2">
                <Button>Sign in with Google</Button>
                <Button>Sign in with Github </Button>
            </div>
            <DialogTitle className="sr-only">Authentication</DialogTitle>
        </DialogContent>
    </Dialog>
  )
}
