"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

interface Props {
  name: string;
  email: string;
  role: string;
}

export function Header({ name, email, role }: Props) {
  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6">
      <div className="text-sm text-slate-500">Welcome back, <span className="font-medium text-slate-900">{name}</span></div>
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="text-sm font-medium">{email}</div>
          <div className="text-xs text-slate-500">{role}</div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="btn-secondary text-xs gap-2"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </div>
    </header>
  );
}
