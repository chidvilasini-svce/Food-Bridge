import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { errorMessage, ORG_TYPES } from "@/lib/donations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "@/components/foodbridge/ui-bits";

type Search = { mode?: "signin" | "signup" | "forgot"; role?: "donor" | "recipient" };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    mode: s.mode === "signup" || s.mode === "forgot" ? s.mode : undefined,
    role: s.role === "donor" || s.role === "recipient" ? s.role : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — FoodBridge" },
      { name: "description", content: "Sign in or create a FoodBridge donor or NGO/volunteer account." },
      { property: "og:title", content: "Join FoodBridge" },
      { property: "og:description", content: "Create a donor or NGO/volunteer account on FoodBridge." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(search.mode ?? "signin");
  const [role, setRole] = useState<"donor" | "recipient">(search.role ?? "donor");
  const [f, setF] = useState({ email: "", password: "", full_name: "", organization_name: "", organization_type: "", area: "", city: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  useEffect(() => {
    if (session) navigate({ to: "/dashboard", replace: true });
  }, [session, navigate]);

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
        if (error) throw error;
        toast.success("Welcome back!");
      } else if (mode === "signup") {
        if (f.password.length < 8) throw new Error("Password must be at least 8 characters.");
        const { data, error } = await supabase.auth.signUp({
          email: f.email,
          password: f.password,
          options: {
            emailRedirectTo: window.location.origin + "/dashboard",
            data: {
              role,
              full_name: f.full_name.trim(),
              organization_name: f.organization_name.trim(),
              organization_type: f.organization_type || null,
              area: f.area.trim(),
              city: f.city.trim(),
            },
          },
        });
        if (error) throw error;
        if (!data.session) setSent("Check your inbox to confirm your email, then sign in.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(f.email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        setSent("If an account exists for that email, a reset link is on its way.");
      }
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grain flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-lift">
        <Logo />
        {sent ? (
          <div className="mt-8 flex flex-col items-center gap-3 text-center">
            <MailCheck className="size-10 text-primary" />
            <p>{sent}</p>
            <Button variant="outline" onClick={() => { setSent(null); setMode("signin"); }}>Back to sign in</Button>
          </div>
        ) : (
          <>
            <h1 className="mt-6 text-2xl font-semibold">
              {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password"}
            </h1>
            <form onSubmit={submit} className="mt-6 grid gap-4">
              {mode === "signup" && (
                <>
                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1" role="radiogroup" aria-label="Account type">
                    {(["donor", "recipient"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        role="radio"
                        aria-checked={role === r}
                        onClick={() => { setRole(r); setF((s) => ({ ...s, organization_type: "" })); }}
                        className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${role === r ? "bg-card shadow-soft" : "text-muted-foreground"}`}
                      >
                        {r === "donor" ? "I'm donating food" : "NGO / Volunteer"}
                      </button>
                    ))}
                  </div>
                  <p className="-mt-2 text-xs text-muted-foreground">Account type is fixed after signup.</p>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Your name</Label>
                    <Input id="name" required maxLength={120} value={f.full_name} onChange={set("full_name")} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="org">Organization</Label>
                      <Input id="org" maxLength={160} placeholder="Optional" value={f.organization_name} onChange={set("organization_name")} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Type</Label>
                      <Select value={f.organization_type} onValueChange={(v) => setF((s) => ({ ...s, organization_type: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {ORG_TYPES[role].map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="area">Area</Label>
                      <Input id="area" maxLength={120} value={f.area} onChange={set("area")} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" maxLength={80} value={f.city} onChange={set("city")} />
                    </div>
                  </div>
                </>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" required value={f.email} onChange={set("email")} />
              </div>
              {mode !== "forgot" && (
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {mode === "signin" && (
                      <button type="button" className="text-xs text-primary hover:underline" onClick={() => setMode("forgot")}>
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <Input id="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={mode === "signup" ? 8 : undefined} value={f.password} onChange={set("password")} />
                </div>
              )}
              <Button type="submit" size="lg" disabled={busy}>
                {busy && <Loader2 className="size-4 animate-spin" />}
                {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "signin" ? (
                <>New to FoodBridge? <button className="font-semibold text-primary hover:underline" onClick={() => setMode("signup")}>Create an account</button></>
              ) : (
                <>Already have an account? <button className="font-semibold text-primary hover:underline" onClick={() => setMode("signin")}>Sign in</button></>
              )}
            </p>
            <p className="mt-2 text-center text-xs text-muted-foreground"><Link to="/" className="hover:underline">← Back home</Link></p>
          </>
        )}
      </div>
    </div>
  );
}
