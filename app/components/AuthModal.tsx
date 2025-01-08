import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { GithubAuthButton, GoogleAuthButton } from "./SubmitButton";

import Image from "next/image";
import Logo from "@/public/logo.png";
import { handleGoogleSignIn, handleGithubSignIn } from "@/app/actions/actions";

export default function AuthModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Free while in Beta</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[360px]">
        <DialogTitle className="sr-only">Sign in to MyCalendar</DialogTitle>
        <DialogHeader className="flex flex-row items-center gap-2 justify-center">
          <Image src={Logo} alt="logo" className="size-6" />
          <h4 className="font-semibold text-xl">
            my<span className="text-primary">calendar</span>
          </h4>
        </DialogHeader>
        <DialogDescription className="space-y-6 text-center">
          <div>
            <span className="font-medium block">Hey legend! 👋</span>
            <span className="mt-2 block">
              Thanks for checking out mycalendar. We&apos;re currently in beta,
              so things will be changing rapidly. For our early adopters,
              we&apos;re offering{" "}
              <span className="font-medium text-primary">
                free access to the platform.
              </span>
            </span>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <span className="block">
              After that, you&apos;ll have the opportunity to continue with
              mycalendar <span className="font-medium">free for life</span> just
              by telling a few friends about us.
            </span>
          </div>

          <div className="text-sm">
            <span className="block text-muted-foreground">Sound fair?</span>
            <span className="font-medium block">
              Cool, sign up below and get started 👇
            </span>
          </div>
        </DialogDescription>
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
  );
}
