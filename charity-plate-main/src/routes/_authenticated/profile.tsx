import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { errorMessage } from "@/lib/donations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingState, PageHeader } from "@/components/foodbridge/ui-bits";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — FoodBridge" }, { name: "description", content: "Update your FoodBridge profile." }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, role, refreshProfile } = useAuth();
  const [f, setF] = useState({ full_name: "", organization_name: "", phone: "", area: "", city: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (profile) setF({ full_name: profile.full_name, organization_name: profile.organization_name ?? "", phone: profile.phone ?? "", area: profile.area ?? "", city: profile.city ?? "" });
  }, [profile]);
  if (!profile) return <LoadingState />;
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      full_name: f.full_name.trim(), organization_name: f.organization_name.trim() || null,
      phone: f.phone.trim() || null, area: f.area.trim() || null, city: f.city.trim() || null,
    }).eq("id", profile!.id);
    setBusy(false);
    if (error) return toast.error(errorMessage(error));
    toast.success("Profile saved");
    refreshProfile();
  }
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <PageHeader title="Profile" subtitle={`Account type: ${role === "donor" ? "Donor" : "NGO / Volunteer"} (fixed)`} />
      <form onSubmit={save} className="grid gap-4 rounded-2xl border bg-card p-6 shadow-soft">
        {(["full_name", "organization_name", "phone", "area", "city"] as const).map((k) => (
          <div key={k} className="grid gap-2">
            <Label htmlFor={k}>{{ full_name: "Name", organization_name: "Organization", phone: "Phone (shared with matched partners)", area: "Area", city: "City" }[k]}</Label>
            <Input id={k} value={f[k]} maxLength={k === "phone" ? 30 : 160} onChange={(e) => setF((s) => ({ ...s, [k]: e.target.value }))} />
          </div>
        ))}
        <Button type="submit" disabled={busy}>Save</Button>
      </form>
    </div>
  );
}
