-- FoodBridge schema
CREATE TYPE public.app_role AS ENUM ('donor', 'recipient');
CREATE TYPE public.donation_status AS ENUM ('available', 'claimed', 'collected', 'cancelled', 'expired');
CREATE TYPE public.claim_status AS ENUM ('active', 'collected', 'cancelled');
CREATE TYPE public.food_type AS ENUM ('veg', 'non_veg', 'vegan', 'mixed');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '' CHECK (char_length(full_name) <= 120),
  organization_name text CHECK (char_length(organization_name) <= 160),
  organization_type text CHECK (organization_type IN ('restaurant','home','hostel','canteen','caterer','ngo','volunteer','shelter','other')),
  phone text CHECK (char_length(phone) <= 30),
  area text CHECK (char_length(area) <= 120),
  city text CHECK (char_length(city) <= 80),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles readable by signed-in users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Roles readable by signed-in users" ON public.user_roles FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  description text CHECK (char_length(description) <= 1000),
  food_type public.food_type NOT NULL DEFAULT 'veg',
  quantity numeric(10,2) NOT NULL CHECK (quantity > 0 AND quantity <= 100000),
  unit text NOT NULL DEFAULT 'kg' CHECK (unit IN ('kg','plates','packets','litres','boxes','items')),
  servings integer NOT NULL CHECK (servings > 0 AND servings <= 100000),
  weight_kg numeric(10,2) NOT NULL DEFAULT 0 CHECK (weight_kg >= 0 AND weight_kg <= 100000),
  image_path text CHECK (char_length(image_path) <= 300),
  pickup_area text NOT NULL CHECK (char_length(pickup_area) BETWEEN 2 AND 120),
  pickup_address text CHECK (char_length(pickup_address) <= 300),
  city text NOT NULL CHECK (char_length(city) BETWEEN 2 AND 80),
  pickup_instructions text CHECK (char_length(pickup_instructions) <= 500),
  prepared_at timestamptz NOT NULL,
  pickup_deadline timestamptz NOT NULL,
  status public.donation_status NOT NULL DEFAULT 'available',
  claimed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  collected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT deadline_after_prepared CHECK (pickup_deadline > prepared_at),
  CONSTRAINT claimed_consistency CHECK ((status IN ('claimed','collected')) = (claimed_by IS NOT NULL) OR status IN ('cancelled','expired'))
);
CREATE INDEX donations_status_deadline_idx ON public.donations (status, pickup_deadline);
CREATE INDEX donations_donor_idx ON public.donations (donor_id, created_at DESC);
CREATE INDEX donations_claimed_by_idx ON public.donations (claimed_by);
CREATE INDEX donations_city_area_idx ON public.donations (lower(city), lower(pickup_area));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donations TO authenticated;
GRANT ALL ON public.donations TO service_role;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Donations readable by signed-in users" ON public.donations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Donors create own donations" ON public.donations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = donor_id AND public.has_role(auth.uid(), 'donor'));
CREATE POLICY "Donors edit own available donations" ON public.donations FOR UPDATE TO authenticated
  USING (auth.uid() = donor_id AND status = 'available') WITH CHECK (auth.uid() = donor_id);
CREATE POLICY "Donors delete own unclaimed donations" ON public.donations FOR DELETE TO authenticated
  USING (auth.uid() = donor_id AND status IN ('available','cancelled','expired') AND claimed_by IS NULL);

CREATE TABLE public.claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.claim_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX claims_one_active_per_donation ON public.claims (donation_id) WHERE status IN ('active','collected');
CREATE INDEX claims_recipient_idx ON public.claims (recipient_id, created_at DESC);
GRANT SELECT ON public.claims TO authenticated;
GRANT ALL ON public.claims TO service_role;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Claim visible to recipient or donor" ON public.claims FOR SELECT TO authenticated USING (
  recipient_id = auth.uid() OR EXISTS (SELECT 1 FROM public.donations d WHERE d.id = donation_id AND d.donor_id = auth.uid())
);

CREATE TABLE public.status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  from_status public.donation_status,
  to_status public.donation_status NOT NULL,
  note text CHECK (char_length(note) <= 300),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX status_events_donation_idx ON public.status_events (donation_id, created_at);
GRANT SELECT ON public.status_events TO authenticated;
GRANT ALL ON public.status_events TO service_role;
ALTER TABLE public.status_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events visible to donor or claimant" ON public.status_events FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.donations d WHERE d.id = donation_id AND (d.donor_id = auth.uid() OR d.claimed_by = auth.uid()))
  OR EXISTS (SELECT 1 FROM public.claims c WHERE c.donation_id = status_events.donation_id AND c.recipient_id = auth.uid())
);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER donations_touch BEFORE UPDATE ON public.donations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER claims_touch BEFORE UPDATE ON public.claims FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.guard_profile_update() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.id <> OLD.id OR NEW.created_at <> OLD.created_at THEN RAISE EXCEPTION 'Immutable profile fields'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER profiles_guard BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.guard_profile_update();

CREATE OR REPLACE FUNCTION public.guard_donation_write() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'available'; NEW.claimed_by := NULL; NEW.claimed_at := NULL; NEW.collected_at := NULL;
    IF NEW.pickup_deadline <= now() THEN RAISE EXCEPTION 'Pickup deadline must be in the future'; END IF;
    IF NEW.prepared_at > now() + interval '1 hour' THEN RAISE EXCEPTION 'Prepared time cannot be in the future'; END IF;
    RETURN NEW;
  END IF;
  IF coalesce(current_setting('foodbridge.lifecycle', true), '') <> 'on' THEN
    IF NEW.status IS DISTINCT FROM OLD.status OR NEW.claimed_by IS DISTINCT FROM OLD.claimed_by
       OR NEW.claimed_at IS DISTINCT FROM OLD.claimed_at OR NEW.collected_at IS DISTINCT FROM OLD.collected_at
       OR NEW.donor_id IS DISTINCT FROM OLD.donor_id OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Status changes must use the FoodBridge actions';
    END IF;
    IF NEW.pickup_deadline <= now() THEN RAISE EXCEPTION 'Pickup deadline must be in the future'; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER donations_guard BEFORE INSERT OR UPDATE ON public.donations FOR EACH ROW EXECUTE FUNCTION public.guard_donation_write();

CREATE OR REPLACE FUNCTION public.log_donation_created() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.status_events (donation_id, actor_id, from_status, to_status, note)
  VALUES (NEW.id, NEW.donor_id, NULL, 'available', 'Donation posted');
  RETURN NEW;
END $$;
CREATE TRIGGER donations_created_event AFTER INSERT ON public.donations FOR EACH ROW EXECUTE FUNCTION public.log_donation_created();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _role public.app_role;
  _org_type text := NEW.raw_user_meta_data->>'organization_type';
BEGIN
  _role := CASE WHEN NEW.raw_user_meta_data->>'role' = 'donor' THEN 'donor'::public.app_role ELSE 'recipient'::public.app_role END;
  IF _org_type IS NOT NULL AND _org_type NOT IN ('restaurant','home','hostel','canteen','caterer','ngo','volunteer','shelter','other') THEN _org_type := NULL; END IF;
  INSERT INTO public.profiles (id, full_name, organization_name, organization_type, area, city)
  VALUES (NEW.id,
    left(coalesce(NEW.raw_user_meta_data->>'full_name', ''), 120),
    nullif(left(coalesce(NEW.raw_user_meta_data->>'organization_name', ''), 160), ''),
    _org_type,
    nullif(left(coalesce(NEW.raw_user_meta_data->>'area', ''), 120), ''),
    nullif(left(coalesce(NEW.raw_user_meta_data->>'city', ''), 80), ''));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.claim_donation(p_donation_id uuid) RETURNS public.donations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.donations; uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF NOT public.has_role(uid, 'recipient') THEN RAISE EXCEPTION 'Only NGOs/volunteers can claim donations'; END IF;
  SELECT * INTO d FROM public.donations WHERE id = p_donation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Donation not found'; END IF;
  IF d.status <> 'available' THEN RAISE EXCEPTION 'This donation has already been claimed or is no longer available'; END IF;
  IF d.pickup_deadline <= now() THEN RAISE EXCEPTION 'The pickup deadline has passed'; END IF;
  PERFORM set_config('foodbridge.lifecycle', 'on', true);
  UPDATE public.donations SET status = 'claimed', claimed_by = uid, claimed_at = now() WHERE id = d.id RETURNING * INTO d;
  INSERT INTO public.claims (donation_id, recipient_id) VALUES (d.id, uid);
  INSERT INTO public.status_events (donation_id, actor_id, from_status, to_status, note) VALUES (d.id, uid, 'available', 'claimed', 'Reserved for pickup');
  PERFORM set_config('foodbridge.lifecycle', 'off', true);
  RETURN d;
END $$;

CREATE OR REPLACE FUNCTION public.release_claim(p_donation_id uuid) RETURNS public.donations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.donations; uid uuid := auth.uid();
BEGIN
  SELECT * INTO d FROM public.donations WHERE id = p_donation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Donation not found'; END IF;
  IF d.status <> 'claimed' OR d.claimed_by IS DISTINCT FROM uid THEN RAISE EXCEPTION 'You do not hold an active claim on this donation'; END IF;
  PERFORM set_config('foodbridge.lifecycle', 'on', true);
  UPDATE public.claims SET status = 'cancelled' WHERE donation_id = d.id AND status = 'active';
  IF d.pickup_deadline > now() THEN
    UPDATE public.donations SET status = 'available', claimed_by = NULL, claimed_at = NULL WHERE id = d.id RETURNING * INTO d;
    INSERT INTO public.status_events (donation_id, actor_id, from_status, to_status, note) VALUES (d.id, uid, 'claimed', 'available', 'Claim released by recipient');
  ELSE
    UPDATE public.donations SET status = 'expired', claimed_by = NULL, claimed_at = NULL WHERE id = d.id RETURNING * INTO d;
    INSERT INTO public.status_events (donation_id, actor_id, from_status, to_status, note) VALUES (d.id, uid, 'claimed', 'expired', 'Claim released after deadline');
  END IF;
  PERFORM set_config('foodbridge.lifecycle', 'off', true);
  RETURN d;
END $$;

CREATE OR REPLACE FUNCTION public.confirm_pickup(p_donation_id uuid) RETURNS public.donations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.donations; uid uuid := auth.uid();
BEGIN
  SELECT * INTO d FROM public.donations WHERE id = p_donation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Donation not found'; END IF;
  IF d.donor_id IS DISTINCT FROM uid THEN RAISE EXCEPTION 'Only the donor can confirm pickup'; END IF;
  IF d.status <> 'claimed' THEN RAISE EXCEPTION 'Only claimed donations can be marked collected'; END IF;
  PERFORM set_config('foodbridge.lifecycle', 'on', true);
  UPDATE public.donations SET status = 'collected', collected_at = now() WHERE id = d.id RETURNING * INTO d;
  UPDATE public.claims SET status = 'collected' WHERE donation_id = d.id AND status = 'active';
  INSERT INTO public.status_events (donation_id, actor_id, from_status, to_status, note) VALUES (d.id, uid, 'claimed', 'collected', 'Donor confirmed pickup');
  PERFORM set_config('foodbridge.lifecycle', 'off', true);
  RETURN d;
END $$;

CREATE OR REPLACE FUNCTION public.cancel_donation(p_donation_id uuid, p_reason text DEFAULT NULL) RETURNS public.donations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.donations; uid uuid := auth.uid(); prev public.donation_status;
BEGIN
  SELECT * INTO d FROM public.donations WHERE id = p_donation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Donation not found'; END IF;
  IF d.donor_id IS DISTINCT FROM uid THEN RAISE EXCEPTION 'Only the donor can cancel this donation'; END IF;
  IF d.status NOT IN ('available','claimed') THEN RAISE EXCEPTION 'This donation can no longer be cancelled'; END IF;
  prev := d.status;
  PERFORM set_config('foodbridge.lifecycle', 'on', true);
  UPDATE public.claims SET status = 'cancelled' WHERE donation_id = d.id AND status = 'active';
  UPDATE public.donations SET status = 'cancelled' WHERE id = d.id RETURNING * INTO d;
  INSERT INTO public.status_events (donation_id, actor_id, from_status, to_status, note)
  VALUES (d.id, uid, prev, 'cancelled', coalesce(nullif(left(p_reason, 300), ''), 'Cancelled by donor'));
  PERFORM set_config('foodbridge.lifecycle', 'off', true);
  RETURN d;
END $$;

CREATE OR REPLACE FUNCTION public.expire_overdue_donations() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  PERFORM set_config('foodbridge.lifecycle', 'on', true);
  WITH exp AS (
    UPDATE public.donations SET status = 'expired' WHERE status = 'available' AND pickup_deadline <= now() RETURNING id
  ), ev AS (
    INSERT INTO public.status_events (donation_id, actor_id, from_status, to_status, note)
    SELECT id, NULL, 'available', 'expired', 'Pickup deadline passed' FROM exp RETURNING 1
  ) SELECT count(*) INTO n FROM ev;
  PERFORM set_config('foodbridge.lifecycle', 'off', true);
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.impact_stats() RETURNS json
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT json_build_object(
    'meals_rescued', coalesce((SELECT sum(servings) FROM public.donations WHERE status = 'collected'), 0),
    'kg_saved', coalesce((SELECT sum(weight_kg) FROM public.donations WHERE status = 'collected'), 0),
    'donations_collected', (SELECT count(*) FROM public.donations WHERE status = 'collected'),
    'donations_total', (SELECT count(*) FROM public.donations),
    'available_now', (SELECT count(*) FROM public.donations WHERE status = 'available' AND pickup_deadline > now()),
    'donors', (SELECT count(*) FROM public.user_roles WHERE role = 'donor'),
    'recipients', (SELECT count(*) FROM public.user_roles WHERE role = 'recipient'),
    'co2_kg_avoided', round(coalesce((SELECT sum(weight_kg) FROM public.donations WHERE status = 'collected'), 0) * 2.5, 1)
  )
$$;

REVOKE ALL ON FUNCTION public.claim_donation(uuid), public.release_claim(uuid), public.confirm_pickup(uuid),
  public.cancel_donation(uuid, text), public.expire_overdue_donations(), public.impact_stats(),
  public.handle_new_user(), public.log_donation_created() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_donation(uuid), public.release_claim(uuid), public.confirm_pickup(uuid),
  public.cancel_donation(uuid, text), public.expire_overdue_donations(), public.impact_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.impact_stats() TO anon;

-- Storage policies (private bucket donation-photos)
CREATE POLICY "Signed-in users view donation photos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'donation-photos');
CREATE POLICY "Donors upload photos to own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'donation-photos' AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.has_role(auth.uid(), 'donor') AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp'));
CREATE POLICY "Donors update own photos" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'donation-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Donors delete own photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'donation-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
