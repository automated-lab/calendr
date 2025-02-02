"use client";

import Link from "next/link";
import Image from "next/image";
import Logo from "@/public/logo.png";
import AuthModal from "./AuthModal";
import { ThemeToggle } from "./ThemeToggle";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export function Navbar() {
  return (
    <div className="flex justify-between items-center p-5">
      <Link href="/" className="flex items-center gap-2">
        <Image src={Logo} alt="logo" className="size-6" />
        <h4 className={`font-semibold text-2xl ${poppins.className}`}>
          mycalendar
        </h4>
      </Link>
      <div className="hidden md:flex md:justify-end md:space-x-4">
        <ThemeToggle />
        <AuthModal />
      </div>
    </div>
  );
}
