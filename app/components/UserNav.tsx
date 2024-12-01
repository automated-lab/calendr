'use client'

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { handleSignOut } from "../actions/auth"

interface UserNavProps {
  userImage: string | null | undefined
}

export function UserNav({ userImage }: UserNavProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Image 
          src={userImage || '/fallback-avatar.png'} 
          alt="user avatar" 
          width={30} 
          height={30}
          className="rounded-full cursor-pointer"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
            <DropdownMenuLabel>
                My Account
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                    Settings
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <form className="w-full" action={handleSignOut}>
                    <Button type="submit" variant="ghost" className="w-full text-left">
                        Log Out
                    </Button>
                </form>
            </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 