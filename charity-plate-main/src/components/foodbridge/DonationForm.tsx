import { useState, type FormEvent } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ALLOWED_IMAGE_TYPES,
  errorMessage,
  FOOD_TYPE_LABEL,
  MAX_IMAGE_BYTES,
  UNITS,
  uploadDonationImage,
  type Donation,
} from "@/lib/donations";
import { DonationImage } from "./DonationCard";

export type DonationInput = {
  title: string;
  description: string | null;
  food_type: Donation["food_type"];
  quantity: number;
  unit: string;
  servings: number;
  weight_kg: number;
  pickup_area: string;
  pickup_address: string | null;
  city: string;
  pickup_instructions: string | null;
  prepared_at: string;
  pickup_deadline: string;
  image_path: string | null;
};

function toLocalInput(d: Date) {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function DonationForm({
  userId,
  initial,
  defaults,
  submitLabel,
  onSubmit,
}: {
  userId: string;
  initial?: Donation;
  defaults?: { area?: string | null; city?: string | null };
  submitLabel: string;
  onSubmit: (v: DonationInput) => Promise<void>;
}) {
  const now = new Date();
  const [v, setV] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    food_type: initial?.food_type ?? ("veg" as Donation["food_type"]),
    quantity: initial ? String(initial.quantity) : "",
    unit: initial?.unit ?? "kg",
    servings: initial ? String(initial.servings) : "",
    weight_kg: initial ? String(initial.weight_kg) : "",
    pickup_area: initial?.pickup_area ?? defaults?.area ?? "",
    pickup_address: initial?.pickup_address ?? "",
    city: initial?.city ?? defaults?.city ?? "",
    pickup_instructions: initial?.pickup_instructions ?? "",
    prepared_at: toLocalInput(initial ? new Date(initial.prepared_at) : new Date(now.getTime() - 30 * 60000)),
    pickup_deadline: toLocalInput(initial ? new Date(initial.pickup_deadline) : new Date(now.getTime() + 4 * 3600000)),
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value }));

  function pickFile(f: File | undefined) {
    if (!f) return;
    if (!ALLOWED_IMAGE_TYPES[f.type]) return toast.error("Please choose a JPG, PNG or WebP image.");
    if (f.size > MAX_IMAGE_BYTES) return toast.error("Image must be 5 MB or smaller.");
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setRemoveImage(false);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const quantity = Number(v.quantity);
    const servings = Math.round(Number(v.servings));
    const weight = v.weight_kg === "" ? (v.unit === "kg" ? quantity : 0) : Number(v.weight_kg);
    const prepared = new Date(v.prepared_at);
    const deadline = new Date(v.pickup_deadline);
    if (v.title.trim().length < 3) return setError("Give the donation a short title (3+ characters).");
    if (!(quantity > 0)) return setError("Quantity must be greater than zero.");
    if (!(servings > 0)) return setError("Estimated meals must be at least 1.");
    if (!(weight >= 0)) return setError("Weight must be zero or more.");
    if (v.pickup_area.trim().length < 2 || v.city.trim().length < 2) return setError("Pickup area and city are required.");
    if (isNaN(prepared.getTime()) || isNaN(deadline.getTime())) return setError("Please enter valid times.");
    if (deadline <= new Date()) return setError("Pickup deadline must be in the future.");
    if (deadline <= prepared) return setError("Pickup deadline must be after the prepared time.");

    setBusy(true);
    try {
      let image_path = removeImage ? null : (initial?.image_path ?? null);
      if (file) image_path = await uploadDonationImage(userId, file);
      await onSubmit({
        title: v.title.trim(),
        description: v.description.trim() || null,
        food_type: v.food_type,
        quantity,
        unit: v.unit,
        servings,
        weight_kg: weight,
        pickup_area: v.pickup_area.trim(),
        pickup_address: v.pickup_address.trim() || null,
        city: v.city.trim(),
        pickup_instructions: v.pickup_instructions.trim() || null,
        prepared_at: prepared.toISOString(),
        pickup_deadline: deadline.toISOString(),
        image_path,
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const showExisting = !preview && !removeImage && initial?.image_path;

  return (
    <form onSubmit={submit} className="grid gap-6 rounded-2xl border bg-card p-6 shadow-soft">
      <div className="grid gap-2">
        <Label>Photo (optional)</Label>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative size-28 overflow-hidden rounded-xl border bg-secondary">
            {preview ? (
              <img src={preview} alt="Selected" className="size-full object-cover" />
            ) : showExisting ? (
              <DonationImage path={initial!.image_path} alt="Current" className="size-full" />
            ) : (
              <div className="grid size-full place-items-center text-primary/60">
                <ImagePlus className="size-7" />
              </div>
            )}
            {(preview || showExisting) && (
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  setRemoveImage(true);
                }}
                className="absolute right-1 top-1 rounded-full bg-card p-1 shadow-soft"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => pickFile(e.target.files?.[0])} />
            <p className="mt-1">JPG, PNG or WebP, up to 5 MB.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" required maxLength={120} placeholder="e.g. Veg biryani & dal from lunch buffet" value={v.title} onChange={set("title")} />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="desc">Description</Label>
          <Textarea id="desc" maxLength={1000} placeholder="What's included, allergens, packaging…" value={v.description} onChange={set("description")} />
        </div>
        <div className="grid gap-2">
          <Label>Food type</Label>
          <Select value={v.food_type} onValueChange={(x) => setV((s) => ({ ...s, food_type: x as Donation["food_type"] }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(FOOD_TYPE_LABEL).map(([k, l]) => (
                <SelectItem key={k} value={k}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <div className="grid gap-2">
            <Label htmlFor="qty">Quantity</Label>
            <Input id="qty" type="number" min="0.1" step="0.1" required value={v.quantity} onChange={set("quantity")} />
          </div>
          <div className="grid gap-2">
            <Label>Unit</Label>
            <Select value={v.unit} onValueChange={(x) => setV((s) => ({ ...s, unit: x }))}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="servings">Estimated meals</Label>
          <Input id="servings" type="number" min="1" step="1" required value={v.servings} onChange={set("servings")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="weight">Approx. weight (kg)</Label>
          <Input id="weight" type="number" min="0" step="0.1" placeholder={v.unit === "kg" ? "Same as quantity" : "0"} value={v.weight_kg} onChange={set("weight_kg")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="prepared">Prepared at</Label>
          <Input id="prepared" type="datetime-local" required value={v.prepared_at} onChange={set("prepared_at")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="deadline">Pickup deadline</Label>
          <Input id="deadline" type="datetime-local" required value={v.pickup_deadline} onChange={set("pickup_deadline")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="area">Pickup area / locality</Label>
          <Input id="area" required maxLength={120} placeholder="e.g. Banjara Hills" value={v.pickup_area} onChange={set("pickup_area")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" required maxLength={80} placeholder="e.g. Hyderabad" value={v.city} onChange={set("city")} />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="addr">Pickup address (shared with signed-in users)</Label>
          <Input id="addr" maxLength={300} value={v.pickup_address} onChange={set("pickup_address")} />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="instr">Pickup instructions</Label>
          <Textarea id="instr" maxLength={500} placeholder="Gate number, contact person, containers needed…" value={v.pickup_instructions} onChange={set("pickup_instructions")} />
        </div>
      </div>

      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" disabled={busy}>
        {busy && <Loader2 className="size-4 animate-spin" />} {submitLabel}
      </Button>
    </form>
  );
}
