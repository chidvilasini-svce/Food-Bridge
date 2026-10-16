import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Menu, UserRound } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "./ui-bits";

const linkCls = "rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground";
const activeCls = { className: "rounded-full px-3 py-1.5 text-sm font-medium bg-secondary text-foreground" };

export function SiteHeader() {
  const { session, profile, role } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const links = session ? (
    <>
      <Link to="/dashboard" className={linkCls} activeProps={activeCls} onClick={() => setOpen(false)}>
        Dashboard
      </Link>
      <Link to="/browse" className={linkCls} activeProps={activeCls} onClick={() => setOpen(false)}>
        Browse food
      </Link>
      {role === "donor" && (
        <Link to="/donations/new" className={linkCls} activeProps={activeCls} onClick={() => setOpen(false)}>
          Post surplus
        </Link>
      )}
      <Link to="/impact" className={linkCls} activeProps={activeCls} onClick={() => setOpen(false)}>
        Impact
      </Link>
    </>
  ) : (
    <>
      <Link to="/impact" className={linkCls} activeProps={activeCls} onClick={() => setOpen(false)}>
        Impact
      </Link>
      <Link to="/about" className={linkCls} activeProps={activeCls} onClick={() => setOpen(false)}>
        How it works
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" aria-label="FoodBridge home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">{links}</nav>
        <div className="flex items-center gap-2">
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full">
                  <UserRound className="size-4" />
                  <span className="hidden max-w-32 truncate sm:inline">{profile?.full_name || "Account"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="truncate">{profile?.full_name || session.user.email}</div>
                  <div className="text-xs font-normal text-muted-foreground">
                    {role === "donor" ? "Donor" : role === "recipient" ? "NGO / Volunteer" : ""}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate({ to: "/profile" })}>Profile settings</DropdownMenuItem>
                <DropdownMenuItem onSelect={signOut}>
                  <LogOut className="size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="rounded-full">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu" onClick={() => setOpen((o) => !o)}>
            <Menu className="size-5" />
          </Button>
        </div>
      </div>
      {open && <nav className="flex flex-col gap-1 border-t px-4 py-3 md:hidden">{links}</nav>}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t bg-forest text-forest-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <Logo />
        <p className="text-sm opacity-80">Problem statement S-6 · Leftover Food Sharing · Rescue surplus, feed people.</p>
      </div>
    </footer>
  );
}
