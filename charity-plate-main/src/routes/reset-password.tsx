import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { errorMessage } from "@/lib/donations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — FoodBridge" },
      { name: "description", content: "Choose a new password for your FoodBridge account." },
      { property: "og:title", content: "Reset password — FoodBridge" },
      { property: "og:description", content: "Choose a new password for your FoodBridge account." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const { session, ready } = useAuth();
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Password must be at least 8 characters.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(errorMessage(error));
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-lift">
        <h1 className="text-2xl font-semibold">Set a new password</h1>
        {ready && !session ? (
          <p className="mt-4 text-sm text-muted-foreground">This reset link is invalid or has expired. Request a new one from the sign-in page.</p>
        ) : (
          <form onSubmit={submit} className="mt-6 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="pw">New password</Label>
              <Input id="pw" type="password" minLength={8} required autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
            </div>
            <Button type="submit" disabled={busy || !session}>
              {busy && <Loader2 className="size-4 animate-spin" />} Update password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
