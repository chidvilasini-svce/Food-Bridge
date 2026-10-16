import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, Database, MapPinned, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/foodbridge/ui-bits";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "How FoodBridge works" },
      { name: "description", content: "The S-6 problem, FoodBridge's solution, the donation lifecycle and the roadmap." },
      { property: "og:title", content: "How FoodBridge works" },
      { property: "og:description", content: "Centralized surplus food listing, location-based matching, tracking and impact." },
    ],
  }),
  component: About,
});

const lifecycle = ["Available", "Claimed", "Collected"];

function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <PageHeader title="How FoodBridge works" subtitle="Problem statement S-6 · Leftover Food Sharing App" />
      <div className="grid gap-6">
        <section className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="text-2xl font-semibold">The problem</h2>
          <p className="mt-2 text-muted-foreground">
            Restaurants, hostels, canteens and households regularly have edible surplus food, while NGOs and volunteers
            struggle to find it in time. Without a shared, trusted channel the food expires before it reaches anyone.
          </p>
        </section>
        <section className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="text-2xl font-semibold">The lifecycle</h2>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {lifecycle.map((s, i) => (
              <span key={s} className="flex items-center gap-2">
                <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold">{s}</span>
                {i < lifecycle.length - 1 && <span className="text-muted-foreground">→</span>}
              </span>
            ))}
            <span className="text-sm text-muted-foreground">(or Cancelled / Expired)</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Only one NGO or volunteer can hold a claim at a time. Only the donor can confirm pickup. Every change is
            recorded in the donation's activity timeline.
          </p>
        </section>
        <section className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="text-2xl font-semibold">Location matching today</h2>
          <p className="mt-2 flex gap-3 text-muted-foreground">
            <MapPinned className="mt-1 size-5 shrink-0 text-primary" />
            This MVP uses an honest list-based approach: donations are tagged with a city and locality, and browse
            results put listings in your saved area first. No map or GPS distance is shown because no maps provider is
            configured yet.
          </p>
        </section>
        <section className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="text-2xl font-semibold">Roadmap</h2>
          <ul className="mt-3 grid gap-3 text-sm text-muted-foreground">
            <li className="flex gap-3"><Brain className="size-5 shrink-0 text-primary" /> AI demand prediction (e.g. Gemini) to forecast surplus by day and suggest best-fit NGOs.</li>
            <li className="flex gap-3"><MapPinned className="size-5 shrink-0 text-primary" /> Geocoding and distance-sorted maps once a maps API key is added.</li>
            <li className="flex gap-3"><Radio className="size-5 shrink-0 text-primary" /> Push / SMS alerts for new nearby listings.</li>
            <li className="flex gap-3"><Database className="size-5 shrink-0 text-primary" /> Built on Postgres with row-level security instead of the originally proposed Flask/MongoDB stack.</li>
          </ul>
        </section>
        <Button asChild size="lg" className="w-fit rounded-full">
          <Link to="/auth">Get started</Link>
        </Button>
      </div>
    </div>
  );
}
