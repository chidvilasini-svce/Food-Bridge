import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { DonationForm } from "@/components/foodbridge/DonationForm";
import { EmptyState, LoadingState, PageHeader } from "@/components/foodbridge/ui-bits";

export const Route = createFileRoute("/_authenticated/donations/new")({
  head: () => ({ meta: [{ title: "Post surplus food — FoodBridge" }, { name: "description", content: "List surplus food for pickup." }] }),
  component: NewDonation,
});

function NewDonation() {
  const { session, role, profile, profileLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  if (profileLoading || !session) return <LoadingState />;
  if (role !== "donor") return <div className="mx-auto max-w-xl px-4 py-16"><EmptyState title="Donor accounts only" body="Only donor accounts can post surplus food." /></div>;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader title="Post surplus food" subtitle="Nearby NGOs and volunteers will see it immediately." />
      <DonationForm
        userId={session.user.id}
        defaults={{ area: profile?.area, city: profile?.city }}
        submitLabel="Publish donation"
        onSubmit={async (v) => {
          const { data, error } = await supabase.from("donations").insert({ ...v, donor_id: session.user.id }).select("id").single();
          if (error) throw error;
          qc.invalidateQueries();
          toast.success("Donation posted");
          navigate({ to: "/donations/$id", params: { id: data.id } });
        }}
      />
    </div>
  );
}
