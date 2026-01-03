"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { LogOut, User, Settings, FileText, Shield, CreditCard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const { data: session } = useSession();

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
      >
        Sign In
      </Link>
    );
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
            {session.user.email?.[0].toUpperCase() || session.user.name?.[0].toUpperCase() || "U"}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-sm font-medium text-white">
              {session.user.name || session.user.email?.split("@")[0]}
            </div>
            <div className="text-xs text-zinc-400">
              {session.user.type === "guest" ? "Guest" : "Member"}
            </div>
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 bg-[#1a1a1a] border-white/10">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium text-white">{session.user.name || "User"}</p>
          <p className="text-xs text-zinc-400 truncate">{session.user.email}</p>
        </div>

        <DropdownMenuSeparator className="bg-white/10" />

        <DropdownMenuItem asChild className="text-zinc-300 focus:bg-white/10 focus:text-white cursor-pointer">
          <Link href="/settings" className="flex items-center gap-2">
            <Settings size={16} />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="text-zinc-300 focus:bg-white/10 focus:text-white cursor-pointer">
          <Link href="/profile" className="flex items-center gap-2">
            <User size={16} />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/10" />

        <DropdownMenuItem asChild className="text-zinc-300 focus:bg-white/10 focus:text-white cursor-pointer">
          <Link href="/privacy" className="flex items-center gap-2">
            <Shield size={16} />
            Privacy Policy
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="text-zinc-300 focus:bg-white/10 focus:text-white cursor-pointer">
          <Link href="/terms" className="flex items-center gap-2">
            <FileText size={16} />
            Terms of Service
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="text-zinc-300 focus:bg-white/10 focus:text-white cursor-pointer">
          <Link href="/refund" className="flex items-center gap-2">
            <CreditCard size={16} />
            Refund Policy
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/10" />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-red-400 focus:bg-red-500/10 focus:text-red-300 cursor-pointer"
        >
          <LogOut size={16} className="mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
