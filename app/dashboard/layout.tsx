import Link from "next/link";
import React, { ReactNode } from "react";
import Image from "next/image";
import Logo from "@/public/logo.png";
import { DashboardLinks } from "../components/DashboardLinks";
import { MenuIcon } from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "../components/ThemeToggle";
import { UserNav } from "@/app/components/UserNav";
import { requireUser } from "../lib/hooks";
import { redirect } from "next/navigation";
import prisma from "../lib/db";
import { Toaster } from "@/components/ui/sonner";

async function getData(userId: string) {
  const data = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      username: true,
      grantId: true,
    },
  });
  if (!data?.username) {
    redirect("/onboarding");
  }

  if (!data?.grantId) {
    redirect("/onboarding/grant-id");
  }
  return data;
}

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireUser();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const data = await getData(session.user?.id as string);
  return (
    <>
      <div className="min-h-screen w-full grid md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden md:block border-r bg-muted/40">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
              <Link href="/" className="flex items-center gap-2">
                <Image src={Logo} alt="logo" className="size-8" />
                <p className="text-xl font-semibold">
                  Ok<span className="text-zinc-500">Book</span>Me
                </p>
              </Link>
            </div>
            <div className="flex-1">
              <nav className="grid items-start px-2 lg:px-4">
                <DashboardLinks />
              </nav>
            </div>
          </div>
        </div>
        <div className="flex flex-col w-full">
          <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px]">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="md:hidden rounded-full"
                >
                  <MenuIcon className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col gap-2">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <nav className="grid gap-2 mt-10">
                  <DashboardLinks />
                </nav>
              </SheetContent>
            </Sheet>
            <div className="ml-auto flex items-center gap-4">
              <ThemeToggle />
              <UserNav userImage={session?.user?.image} />
            </div>
          </header>
          <main className="flex-1 flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            {children}
          </main>
        </div>
      </div>
      <Toaster richColors closeButton />
    </>
  );
}
