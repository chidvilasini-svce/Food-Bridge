import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { errorMessage, FOOD_TYPE_LABEL, type Donation } from "@/lib/donations";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DonationCard } from "@/components/foodbridge/DonationCard";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/foodbridge/ui-bits";

export const Route = createFileRoute("/_authenticated/browse")({
  head: () => ({ meta: [{ title: "Browse food — FoodBridge" }, { name: "description", content: "Find surplus food available for pickup." }] }),
  component: Browse,
});

export function useDonorNames(ids: string[]) {
  return useQuery({
    queryKey: ["names", [...ids].sort().join(",")],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, organization_name").in("id", ids);
      if (error) throw error;
      return Object.fromEntries(data.map((p) => [p.id, p.organization_name || p.full_name]));
    },
  });
}

function Browse() {
  const { profile } = useAuth();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState("deadline");
  const list = useQuery({
    queryKey: ["browse"],
    queryFn: async () => {
      await supabase.rpc("expire_overdue_donations");
      const { data, error } = await supabase
        .from("donations").select("*").eq("status", "available")
        .gt("pickup_deadline", new Date().toISOString()).order("pickup_deadline").limit(300);
      if (error) throw error;
      return data as Donation[];
    },
  });
  const names = useDonorNames([...new Set((list.data ?? []).map((d) => d.donor_id))]);
  const items = useMemo(() => {
    const t = q.toLowerCase(), c = city.toLowerCase();
    const myArea = profile?.area?.toLowerCase();
    let r = (list.data ?? []).filter((d) =>
      (!t || `${d.title} ${d.description ?? ""} ${d.pickup_area}`.toLowerCase().includes(t)) &&
      (!c || d.city.toLowerCase().includes(c) || d.pickup_area.toLowerCase().includes(c)) &&
      (type === "all" || d.food_type === type));
    r = [...r].sort((a, b) =>
      sort === "meals" ? b.servings - a.servings :
      sort === "newest" ? b.created_at.localeCompare(a.created_at) :
      sort === "near" ? Number(b.pickup_area.toLowerCase() === myArea) - Number(a.pickup_area.toLowerCase() === myArea) :
      a.pickup_deadline.localeCompare(b.pickup_deadline));
    return r;
  }, [list.data, q, city, type, sort, profile]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader title="Available food" subtitle="Listings are matched by city and locality. Map distance arrives once a maps provider is configured." />
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search food…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Input placeholder="City or area" value={city} onChange={(e) => setCity(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {Object.entries(FOOD_TYPE_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="deadline">Most urgent</SelectItem>
              <SelectItem value="near">My area first</SelectItem>
              <SelectItem value="meals">Most meals</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {list.isLoading ? <LoadingState /> : list.error ? <ErrorState message={errorMessage(list.error)} onRetry={() => list.refetch()} /> :
        items.length === 0 ? <EmptyState title="No food available right now" body="Try clearing filters or check back soon." /> : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((d) => <DonationCard key={d.id} donation={d} donorName={names.data?.[d.donor_id]} />)}
          </div>
        )}
    </div>
  );
}
