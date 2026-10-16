import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Cloud, HandHeart, Package, Scale, Utensils } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ErrorState, LoadingState, PageHeader, StatCard } from "@/components/foodbridge/ui-bits";
import { errorMessage } from "@/lib/donations";

export const Route = createFileRoute("/impact")({
  head: () => ({
    meta: [
      { title: "Impact — FoodBridge" },
      { name: "description", content: "Live community impact: meals rescued, food saved and partners on FoodBridge." },
      { property: "og:title", content: "FoodBridge community impact" },
      { property: "og:description", content: "Meals rescued and kilograms of food saved by donors and NGOs on FoodBridge." },
    ],
  }),
  component: ImpactPage,
});

type Stats = {
  meals_rescued: number;
  kg_saved: number;
  donations_collected: number;
  donations_total: number;
  available_now: number;
  donors: number;
  recipients: number;
  co2_kg_avoided: number;
};

export function useImpactStats() {
  return useQuery({
    queryKey: ["impact-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("impact_stats");
      if (error) throw error;
      return data as unknown as Stats;
    },
  });
}

const fmt = (n: number) => Number(n).toLocaleString(undefined, { maximumFractionDigits: 1 });

export function ImpactStrip() {
  const q = useImpactStats();
  if (q.isLoading) return <LoadingState label="Loading live impact…" />;
  if (q.error) return <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />;
  const s = q.data!;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Meals rescued" value={fmt(s.meals_rescued)} icon={<Utensils className="size-4" />} hint="From collected donations" />
      <StatCard label="Food saved" value={`${fmt(s.kg_saved)} kg`} icon={<Scale className="size-4" />} />
      <StatCard label="Available right now" value={fmt(s.available_now)} icon={<Package className="size-4" />} />
      <StatCard label="Partners" value={fmt(s.donors + s.recipients)} icon={<HandHeart className="size-4" />} hint={`${s.donors} donors · ${s.recipients} NGOs/volunteers`} />
    </div>
  );
}

function ImpactPage() {
  const q = useImpactStats();
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <PageHeader title="Community impact" subtitle="Live totals computed from real collected donations — no estimates added." />
      {q.isLoading ? (
        <LoadingState />
      ) : q.error ? (
        <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
      ) : (
        <>
          <ImpactStrip />
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <StatCard label="Donations collected" value={fmt(q.data!.donations_collected)} icon={<Package className="size-4" />} hint={`${fmt(q.data!.donations_total)} posted in total`} />
            <StatCard
              label="Rescue rate"
              value={q.data!.donations_total ? `${Math.round((q.data!.donations_collected / q.data!.donations_total) * 100)}%` : "—"}
              icon={<Building2 className="size-4" />}
              hint="Collected ÷ posted"
            />
            <StatCard label="CO₂e avoided (est.)" value={`${fmt(q.data!.co2_kg_avoided)} kg`} icon={<Cloud className="size-4" />} hint="≈2.5 kg CO₂e per kg of food not wasted" />
          </div>
        </>
      )}
    </div>
  );
}
