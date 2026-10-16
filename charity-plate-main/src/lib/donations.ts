import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Donation = Tables<"donations">;
export type DonationStatus = Donation["status"];
export type StatusEvent = Tables<"status_events">;

export const BUCKET = "donation-photos";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const STATUS_LABEL: Record<DonationStatus, string> = {
  available: "Available",
  claimed: "Claimed",
  collected: "Collected",
  cancelled: "Cancelled",
  expired: "Expired",
};

export const FOOD_TYPE_LABEL: Record<Donation["food_type"], string> = {
  veg: "Vegetarian",
  non_veg: "Non-veg",
  vegan: "Vegan",
  mixed: "Mixed",
};

export const UNITS = ["kg", "plates", "packets", "litres", "boxes", "items"] as const;

export const ORG_TYPES = {
  donor: [
    ["restaurant", "Restaurant"],
    ["home", "Home"],
    ["hostel", "Hostel"],
    ["canteen", "Canteen"],
    ["caterer", "Caterer / Events"],
    ["other", "Other"],
  ],
  recipient: [
    ["ngo", "NGO"],
    ["volunteer", "Volunteer"],
    ["shelter", "Shelter"],
    ["other", "Other"],
  ],
} as const;

/** Status as the user should see it: an "available" listing past its deadline is expired. */
export function effectiveStatus(d: Pick<Donation, "status" | "pickup_deadline">): DonationStatus {
  if (d.status === "available" && new Date(d.pickup_deadline).getTime() <= Date.now()) return "expired";
  return d.status;
}

export function timeLeft(deadline: string) {
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return "Deadline passed";
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m} min left`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ${m % 60}m left`;
  return `${Math.floor(h / 24)} days left`;
}

export function hoursSince(iso: string) {
  const h = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  if (h < 1) return "Prepared < 1h ago";
  return `Prepared ${Math.round(h)}h ago`;
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function errorMessage(e: unknown) {
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return "Something went wrong. Please try again.";
}

export async function uploadDonationImage(userId: string, file: File) {
  const ext = ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) throw new Error("Please upload a JPG, PNG or WebP image.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Image must be 5 MB or smaller.");
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export function useImageUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["image", path],
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path!, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}
