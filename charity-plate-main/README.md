# FoodBridge — Leftover Food Sharing (S-6)

Donors (restaurants, homes, hostels, canteens) post surplus food; NGOs/volunteers browse, claim and collect it. Impact (meals rescued, kg saved) is computed from collected donations.

> Note: the original presentation proposed Flask + MongoDB. This implementation uses Lovable Cloud (Postgres, Auth, Storage) with row-level security.

## Features
- Email/password auth with donor or recipient role (fixed at signup, stored in `user_roles`, no client write access)
- Donor CRUD for donations with private photo storage (JPG/PNG/WebP, 5 MB, per-user folder)
- Browse/search/filter by text, city/area, food type; sort by urgency, my area, meals
- Atomic claim via `claim_donation` RPC (row lock + unique partial index prevents double claims)
- Lifecycle: available → claimed → collected / cancelled / expired, only via RPCs (`release_claim`, `confirm_pickup`, `cancel_donation`, `expire_overdue_donations`); a trigger blocks direct status edits
- Activity timeline (`status_events`) and public impact dashboard (`impact_stats`)

## Setup
1. `bun install && bun run dev`
2. The schema lives in `drizzle/migrations/` (applied automatically on Lovable Cloud).
3. Sign up as a donor in one browser and as an NGO in another to try the full flow.

## Future integrations
- **Geocoding/maps**: add a maps API key as a secret, geocode `pickup_area` + `city` on insert, and sort by distance.
- **Gemini demand prediction**: a server function can send historical donations to Gemini via the AI gateway to forecast surplus and suggest NGOs.
