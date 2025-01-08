import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GithubAuthButton, GoogleAuthButton } from "./SubmitButton";

import Image from "next/image";
import Logo from "@/public/logo.png";
import { handleGoogleSignIn, handleGithubSignIn } from "@/app/actions/actions";

export default function AuthModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Try for Free</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[360px]">
        <DialogTitle className="sr-only">Sign in to MyCalendar</DialogTitle>
        <DialogHeader className="flex flex-row items-center gap-2 justify-center">
          <Image src={Logo} alt="logo" className="size-10" />
          <h4 className="font-semibold text-xl">
            My<span className="text-primary">Calendar</span>
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
  );
}
