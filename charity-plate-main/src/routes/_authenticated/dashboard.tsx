import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Scale, Utensils, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { effectiveStatus, errorMessage, type Donation } from "@/lib/donations";
import { Button } from "@/components/ui/button";
import { DonationCard } from "@/components/foodbridge/DonationCard";
import { EmptyState, ErrorState, LoadingState, PageHeader, StatCard } from "@/components/foodbridge/ui-bits";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — FoodBridge" }, { name: "description", content: "Your donations, claims and impact." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { session, role, profile, profileLoading } = useAuth();
  const uid = session?.user.id;
  const q = useQuery({
    queryKey: ["my-donations", uid, role],
    enabled: !!uid && !!role,
    queryFn: async () => {
      await supabase.rpc("expire_overdue_donations");
      if (role === "donor") {
        const { data, error } = await supabase.from("donations").select("*").eq("donor_id", uid!).order("created_at", { ascending: false });
        if (error) throw error;
        return data as Donation[];
      }
      const { data: claims, error } = await supabase.from("claims").select("donation_id").eq("recipient_id", uid!);
      if (error) throw error;
      if (!claims.length) return [];
      const { data, error: e2 } = await supabase.from("donations").select("*").in("id", claims.map((c) => c.donation_id)).order("created_at", { ascending: false });
      if (e2) throw e2;
      return data as Donation[];
    },
  });
  if (profileLoading || !role) return <LoadingState />;
  const list = q.data ?? [];
  const mine = role === "donor" ? list : list.filter((d) => d.claimed_by === uid);
  const collected = mine.filter((d) => d.status === "collected");
  const meals = collected.reduce((s, d) => s + d.servings, 0);
  const kg = collected.reduce((s, d) => s + Number(d.weight_kg), 0);
  const active = mine.filter((d) => ["available", "claimed"].includes(effectiveStatus(d)));
  const past = list.filter((d) => !active.includes(d));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        title={`Hello${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`}
        subtitle={role === "donor" ? "Your surplus listings and their impact." : "Your claimed pickups and impact."}
        actions={role === "donor"
          ? <Button asChild className="rounded-full"><Link to="/donations/new"><Plus className="size-4" /> Post surplus</Link></Button>
          : <Button asChild className="rounded-full"><Link to="/browse">Browse food</Link></Button>}
      />
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <StatCard label="Meals rescued" value={meals} icon={<Utensils className="size-4" />} />
        <StatCard label="Food saved" value={`${kg.toFixed(1)} kg`} icon={<Scale className="size-4" />} />
        <StatCard label="Active now" value={active.length} icon={<Package className="size-4" />} />
      </div>
      {q.isLoading ? <LoadingState /> : q.error ? <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : (
        <>
          <h2 className="mb-4 text-2xl font-semibold">Active</h2>
          {active.length === 0 ? (
            <EmptyState title={role === "donor" ? "No active listings" : "No active claims"}
              body={role === "donor" ? "Post surplus food so nearby NGOs can collect it." : "Browse available food and claim a pickup."} />
          ) : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{active.map((d) => <DonationCard key={d.id} donation={d} />)}</div>}
          {past.length > 0 && (
            <>
              <h2 className="mb-4 mt-12 text-2xl font-semibold">History</h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{past.map((d) => <DonationCard key={d.id} donation={d} />)}</div>
            </>
          )}
        </>
      )}
    </div>
  );
}
