import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BellRing, ClipboardList, HandHeart, MapPinned, ShieldCheck, Sprout } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { ImpactStrip } from "./impact";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FoodBridge — Share leftover food, feed your city" },
      { name: "description", content: "Restaurants, homes, hostels and canteens post surplus food. NGOs and volunteers claim and collect it before it goes to waste." },
      { property: "og:title", content: "FoodBridge — Share leftover food, feed your city" },
      { property: "og:description", content: "A centralized platform connecting food donors with NGOs and volunteers in real time." },
    ],
  }),
  component: Landing,
});

const steps = [
  { icon: ClipboardList, title: "Donors list surplus", body: "Quantity, photo, pickup area, prepared time and a pickup deadline — in under a minute." },
  { icon: MapPinned, title: "Recipients find nearby food", body: "NGOs and volunteers search by city and locality, filter by food type and urgency." },
  { icon: ShieldCheck, title: "One claim, no clashes", body: "Claims are reserved atomically, so two teams never drive to the same pickup." },
  { icon: HandHeart, title: "Pickup confirmed, impact counted", body: "Donors confirm collection; meals rescued and food saved update instantly." },
];

function Landing() {
  const { session, role } = useAuth();
  return (
    <>
      <section className="grain">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
              <Sprout className="size-3.5" /> Leftover Food Sharing · S-6
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.05] sm:text-6xl">
              Good food should end up on a plate, <em className="text-primary">not in a bin.</em>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              FoodBridge connects restaurants, homes, hostels and canteens with NGOs and volunteers who can collect surplus
              food while it's still fresh.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {session ? (
                <>
                  <Button asChild size="lg" className="rounded-full">
                    <Link to={role === "donor" ? "/donations/new" : "/browse"}>
                      {role === "donor" ? "Post surplus food" : "Browse available food"} <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-full">
                    <Link to="/dashboard">Go to dashboard</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild size="lg" className="rounded-full">
                    <Link to="/auth" search={{ mode: "signup", role: "donor" }}>
                      I have surplus food <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-full">
                    <Link to="/auth" search={{ mode: "signup", role: "recipient" }}>I'm an NGO / volunteer</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="relative">
            <img
              src={heroImg}
              alt="A chef handing a basket of fresh food to a volunteer"
              width={1408}
              height={1056}
              className="aspect-[4/3] w-full rounded-3xl object-cover shadow-lift"
            />
            <div className="absolute -bottom-5 left-5 flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-lift">
              <BellRing className="size-5 text-primary" />
              <div className="text-sm">
                <div className="font-semibold">Claimed in seconds</div>
                <div className="text-muted-foreground">Available → Claimed → Collected</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <ImpactStrip />
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl font-semibold sm:text-4xl">How FoodBridge works</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="rounded-2xl border bg-card p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <s.icon className="size-6 text-primary" />
                <span className="font-display text-3xl text-muted-foreground/40">0{i + 1}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-4">
        <div className="bg-hero flex flex-col items-start gap-5 rounded-3xl p-10 text-forest-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold">Have extra food tonight?</h2>
            <p className="mt-2 opacity-85">Post it now — a nearby team can pick it up before your deadline.</p>
          </div>
          <Button asChild size="lg" variant="secondary" className="rounded-full">
            <Link to={session ? "/dashboard" : "/auth"}>{session ? "Open dashboard" : "Join FoodBridge"}</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
