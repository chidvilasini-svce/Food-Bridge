import { Link } from "@tanstack/react-router";
import { Clock, MapPin, Users, UtensilsCrossed } from "lucide-react";
import {
  effectiveStatus,
  FOOD_TYPE_LABEL,
  hoursSince,
  timeLeft,
  useImageUrl,
  type Donation,
} from "@/lib/donations";
import { StatusBadge } from "./ui-bits";

export function DonationImage({ path, alt, className }: { path: string | null; alt: string; className?: string }) {
  const { data } = useImageUrl(path);
  if (!path || !data)
    return (
      <div className={`grid place-items-center bg-secondary text-primary/60 ${className ?? ""}`}>
        <UtensilsCrossed className="size-8" />
      </div>
    );
  return <img src={data} alt={alt} loading="lazy" className={`object-cover ${className ?? ""}`} />;
}

export function DonationCard({ donation, donorName }: { donation: Donation; donorName?: string | null }) {
  const status = effectiveStatus(donation);
  return (
    <Link
      to="/donations/$id"
      params={{ id: donation.id }}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="relative">
        <DonationImage path={donation.image_path} alt={donation.title} className="aspect-[4/3] w-full" />
        <StatusBadge status={status} className="absolute left-3 top-3 bg-card/95" />
        <span className="absolute right-3 top-3 rounded-full bg-card/95 px-2.5 py-0.5 text-xs font-medium">
          {FOOD_TYPE_LABEL[donation.food_type]}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="line-clamp-1 text-lg font-semibold group-hover:text-primary">{donation.title}</h3>
          {donorName && <p className="text-sm text-muted-foreground">by {donorName}</p>}
        </div>
        <div className="grid gap-1.5 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <MapPin className="size-4 text-primary" /> {donation.pickup_area}, {donation.city}
          </span>
          <span className="flex items-center gap-2">
            <Users className="size-4 text-primary" /> {donation.servings} meals · {Number(donation.quantity)} {donation.unit}
          </span>
          <span className="flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            {status === "available" ? timeLeft(donation.pickup_deadline) : hoursSince(donation.prepared_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}
