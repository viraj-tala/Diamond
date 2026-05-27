"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

interface Props {
  name: string;
  email: string;
  role: string;
}

export function Header({ name, email, role }: Props) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="relative h-14 border-b border-slate-200 bg-white/85 backdrop-blur flex items-center justify-between px-6">
      <div className="text-sm text-slate-500">
        Welcome back,{" "}
        <span className="font-medium text-slate-900">{name.split(" ")[0]}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-3 rounded-full border border-slate-200 bg-white pl-1 pr-3 py-1">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-iris-500 to-iris-700 text-white text-[10px] font-semibold">
            {initials}
          </div>
          <div className="text-right leading-tight">
            <div className="text-xs font-medium text-slate-900">{email}</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">
              {role}
            </div>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="btn-ghost text-xs"
          aria-label="Logout"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      {/* Subtle gradient bottom-edge to separate header from content */}
      <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
    </header>
  );
}
