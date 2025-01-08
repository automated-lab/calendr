"use client";

import Link from "next/link";
import Image from "next/image";
import Logo from "@/public/logo.png";
import AuthModal from "./AuthModal";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  return (
    <div className="flex justify-between items-center p-5">
      <Link href="/" className="flex items-center gap-2">
        <Image src={Logo} alt="logo" className="size-6 dark:invert" />
        <h4 className="font-semibold text-2xl">
          my<span className="text-primary">calendar</span>
        </h4>
      </Link>
      <div className="hidden md:flex md:justify-end md:space-x-4">
        <ThemeToggle />
        <AuthModal />
      </div>
    </div>
  );
}
