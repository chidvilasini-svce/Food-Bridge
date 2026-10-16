import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { errorMessage } from "@/lib/donations";
import { DonationForm } from "@/components/foodbridge/DonationForm";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/foodbridge/ui-bits";

export const Route = createFileRoute("/_authenticated/donations/$id_/edit")({
  head: () => ({ meta: [{ title: "Edit donation — FoodBridge" }, { name: "description", content: "Edit your donation listing." }] }),
  component: EditDonation,
});

function EditDonation() {
  const { id } = Route.useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["donation", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("donations").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  if (q.isLoading || !session) return <LoadingState />;
  if (q.error) return <ErrorState message={errorMessage(q.error)} />;
  const d = q.data;
  if (!d || d.donor_id !== session.user.id || d.status !== "available")
    return <div className="mx-auto max-w-xl px-4 py-16"><EmptyState title="Can't edit this donation" body="Only the donor can edit a listing while it is still available." /></div>;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader title="Edit donation" />
      <DonationForm userId={session.user.id} initial={d} submitLabel="Save changes"
        onSubmit={async (v) => {
          const { error } = await supabase.from("donations").update(v).eq("id", id);
          if (error) throw error;
          qc.invalidateQueries();
          toast.success("Saved");
          navigate({ to: "/donations/$id", params: { id } });
        }} />
    </div>
  );
}
