import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { effectiveStatus, errorMessage, FOOD_TYPE_LABEL, formatDateTime, STATUS_LABEL, timeLeft, type StatusEvent } from "@/lib/donations";
import { Button } from "@/components/ui/button";
import { DonationImage } from "@/components/foodbridge/DonationCard";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/foodbridge/ui-bits";

export const Route = createFileRoute("/_authenticated/donations/$id")({
  head: () => ({ meta: [{ title: "Donation — FoodBridge" }, { name: "description", content: "Donation details and activity." }] }),
  component: DonationDetail,
});

function DonationDetail() {
  const { id } = Route.useParams();
  const { session, role } = useAuth();
  const uid = session?.user.id;
  const qc = useQueryClient();
  const navigate = useNavigate();
  const q = useQuery({
    queryKey: ["donation-detail", id],
    queryFn: async () => {
      const { data: d, error } = await supabase.from("donations").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!d) return null;
      const ids = [d.donor_id, d.claimed_by].filter(Boolean) as string[];
      const [p, ev] = await Promise.all([
        supabase.from("profiles").select("id, full_name, organization_name, phone").in("id", ids),
        supabase.from("status_events").select("*").eq("donation_id", id).order("created_at"),
      ]);
      if (p.error) throw p.error;
      return { d, people: Object.fromEntries((p.data ?? []).map((x) => [x.id, x])), events: (ev.data ?? []) as StatusEvent[] };
    },
  });

  const act = useMutation({
    mutationFn: async (kind: "claim" | "release" | "confirm" | "cancel" | "delete") => {
      const r =
        kind === "claim" ? await supabase.rpc("claim_donation", { p_donation_id: id }) :
        kind === "release" ? await supabase.rpc("release_claim", { p_donation_id: id }) :
        kind === "confirm" ? await supabase.rpc("confirm_pickup", { p_donation_id: id }) :
        kind === "cancel" ? await supabase.rpc("cancel_donation", { p_donation_id: id }) :
        await supabase.from("donations").delete().eq("id", id);
      if (r.error) throw r.error;
      return kind;
    },
    onSuccess: (kind) => {
      qc.invalidateQueries();
      toast.success({ claim: "Claimed! Coordinate pickup with the donor.", release: "Claim released", confirm: "Pickup confirmed — impact recorded", cancel: "Donation cancelled", delete: "Donation deleted" }[kind]);
      if (kind === "delete") navigate({ to: "/dashboard" });
    },
    onError: (e) => { toast.error(errorMessage(e)); qc.invalidateQueries({ queryKey: ["donation-detail", id] }); },
  });

  if (q.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />;
  if (!q.data) return <div className="mx-auto max-w-xl px-4 py-16"><EmptyState title="Donation not found" /></div>;
  const { d, people, events } = q.data;
  const status = effectiveStatus(d);
  const isDonor = d.donor_id === uid;
  const isClaimant = d.claimed_by === uid;
  const donor = people[d.donor_id];
  const claimant = d.claimed_by ? people[d.claimed_by] : null;
  const busy = act.isPending;
  const confirmThen = (kind: "cancel" | "delete" | "release", msg: string) => { if (window.confirm(msg)) act.mutate(kind); };

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.3fr_1fr]">
      <div>
        <DonationImage path={d.image_path} alt={d.title} className="aspect-[16/10] w-full rounded-3xl" />
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <StatusBadge status={status} />
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">{FOOD_TYPE_LABEL[d.food_type]}</span>
        </div>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{d.title}</h1>
        <p className="mt-1 text-muted-foreground">by {donor?.organization_name || donor?.full_name || "Donor"}</p>
        {d.description && <p className="mt-4 whitespace-pre-line">{d.description}</p>}
        <div className="mt-6 grid gap-3 rounded-2xl border bg-card p-5 text-sm sm:grid-cols-2">
          <span className="flex gap-2"><Users className="size-4 text-primary" /> {d.servings} meals · {Number(d.quantity)} {d.unit} · {Number(d.weight_kg)} kg</span>
          <span className="flex gap-2"><MapPin className="size-4 text-primary" /> {d.pickup_area}, {d.city}</span>
          <span className="flex gap-2"><Clock className="size-4 text-primary" /> Prepared {formatDateTime(d.prepared_at)}</span>
          <span className="flex gap-2"><Clock className="size-4 text-primary" /> Pickup by {formatDateTime(d.pickup_deadline)} ({timeLeft(d.pickup_deadline)})</span>
          {d.pickup_address && <span className="sm:col-span-2"><b>Address:</b> {d.pickup_address}</span>}
          {d.pickup_instructions && <span className="sm:col-span-2"><b>Instructions:</b> {d.pickup_instructions}</span>}
        </div>
      </div>

      <aside className="grid content-start gap-6">
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <h2 className="text-xl font-semibold">Actions</h2>
          <div className="mt-4 grid gap-2">
            {role === "recipient" && status === "available" && <Button disabled={busy} onClick={() => act.mutate("claim")}>Claim this donation</Button>}
            {isClaimant && status === "claimed" && (
              <>
                <p className="text-sm text-muted-foreground">You've reserved this. Contact: {donor?.phone || "no phone on donor profile"}. The donor confirms once you collect.</p>
                <Button variant="outline" disabled={busy} onClick={() => confirmThen("release", "Release your claim so others can pick it up?")}>Release claim</Button>
              </>
            )}
            {isDonor && status === "claimed" && (
              <>
                <p className="text-sm text-muted-foreground">Claimed by {claimant?.organization_name || claimant?.full_name}{claimant?.phone ? ` · ${claimant.phone}` : ""}</p>
                <Button disabled={busy} onClick={() => act.mutate("confirm")}>Confirm pickup collected</Button>
              </>
            )}
            {isDonor && status === "available" && (
              <Button asChild variant="outline"><Link to="/donations/$id/edit" params={{ id }}>Edit listing</Link></Button>
            )}
            {isDonor && (d.status === "available" || d.status === "claimed") && (
              <Button variant="outline" disabled={busy} onClick={() => confirmThen("cancel", "Cancel this donation?")}>Cancel donation</Button>
            )}
            {isDonor && !d.claimed_by && ["available", "cancelled", "expired"].includes(d.status) && (
              <Button variant="destructive" disabled={busy} onClick={() => confirmThen("delete", "Delete permanently?")}>Delete</Button>
            )}
            {!isDonor && !isClaimant && status !== "available" && <p className="text-sm text-muted-foreground">This donation is {STATUS_LABEL[status].toLowerCase()}.</p>}
            {isDonor && ["collected", "cancelled", "expired"].includes(status) && <p className="text-sm text-muted-foreground">No further actions — this donation is {STATUS_LABEL[status].toLowerCase()}.</p>}
          </div>
        </div>
        {(isDonor || isClaimant || events.length > 0) && (
          <div className="rounded-2xl border bg-card p-5 shadow-soft">
            <h2 className="text-xl font-semibold">Activity</h2>
            {events.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Activity is visible to the donor and claimant.</p> : (
              <ol className="mt-4 grid gap-4 border-l-2 border-secondary pl-4">
                {events.map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[23px] top-1 size-3 rounded-full bg-primary" />
                    <div className="text-sm font-semibold">{STATUS_LABEL[e.to_status]}</div>
                    <div className="text-xs text-muted-foreground">{formatDateTime(e.created_at)} · {e.note}</div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
