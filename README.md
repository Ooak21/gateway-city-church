# GateWay City Church app (IBS build)

Congregant PWA + Sunday projector + staff board. Replaces the Tithe.ly app
dependency (their API is closed) and feeds the Grace CRM data layer, which
now lives on IBS Supabase as the `church_*` tables. Local-first: everything
in this folder runs with zero backend in DEMO_MODE.

## Files

| File | What it is |
|---|---|
| `index.html` | Congregant app. QR entry (`?src=qr`), connect card, check-in with geofence confirm, Sunday mode (enter/exit watcher), events calendar, volunteer signups, prayer requests (crisis gate hard-stops to 911/988), message a pastor, Give link. Installable PWA. |
| `sunday.html` | Dark projector screen for the sanctuary. QR pointing at the app, live checked-in counter. |
| `staff.html` | Light staff board. Arrivals/departures feed, prayer queue, pastor inbox, volunteer signups, today's stats. 10s polling. |
| `login.html` + `auth.js` | Staff auth, SOP 3-file pattern. Staff = `app_metadata.role` in (`gcc_staff`, `gcc_admin`). Congregants never log in. |
| `gcc-config.js` | The one config block. `DEMO_MODE`, campus coords + fence radius, services, pastors, Give URL, anon key slot. |
| `gcc-data.js` | Data layer. DEMO_MODE = localStorage; live = Supabase PostgREST with anon key + RLS. |
| `geofence.js` | Ported from Sanctuary Watch. Haversine, one-shot campus check, enter/exit watcher. |
| `sql/church_schema.sql` | The Grace CRM migration. NOT applied yet. Review then apply. |
| `manifest.json` + `sw.js` | PWA install + network-first shell cache (never caches Supabase). |

## Run the demo

```bash
cd app && python3 -m http.server 8001
# phone on same wifi: http://<laptop-ip>:8001  (geolocation needs localhost or HTTPS)
```

## Geofence truth (say it straight to the church)

QR scan is the primary enter event. GPS runs only while the page is open
("Sunday mode"); a web app cannot do background geofencing with the phone in
a pocket, that requires an App Store build. What we ship: scan or open on
campus -> location confirmed -> attendance logged; keep the app open and
enter/exit both log with distance. Sanctuary Watch demo logic, productized.

## Go-live checklist (in order)

1. Review + apply `sql/church_schema.sql` to `jtifhcvbgxqwlywugvjv`.
2. Fill `SUPABASE_ANON_KEY` in `gcc-config.js`, set `DEMO_MODE: false`.
3. Create staff users (Pastor Danny, staff) with `app_metadata.role = 'gcc_staff'`.
4. Real Tithe.ly giving URL into `GIVE_URL`.
5. New IBS repo (proposed `Ooak21/gateway-city-church`), this `app/` as root,
   GitHub Pages + domain decision (subdomain of mygatewaycity.church ideal).
6. Print/project QR from `sunday.html` (it encodes `APP_URL?src=qr`).
7. Later: `gcc-mailer` edge function (Resend, replaces the Gmail app-password
   hack from Sanctuary Watch) for welcome/thank-you emails; Telnyx 702 number
   WITH auto-recharge for SMS thank-yous; service-end cron.

## The welcome/goodbye system (Door 1, final design)

Three layers, all writing the same tables, all texting through Telnyx:

1. **Service blasts (`gcc-service-blast`)** — the Awaken experience. Scan the
   QR once, connect card captures number + opt-in, then pg_cron texts every
   opted-in member "Welcome!" at service start and "we're always here" at
   service end. Zero member setup. Feels like presence; it is a timer.
2. **True arrival detection (`gcc-geo-ping` + SHORTCUT.md)** — Apple
   Shortcuts Arrive/Leave automations ping the endpoint with the member's
   personal code; phone in pocket, fully autonomous, per-member opt-in
   upgrade guided by the app's Auto-welcome card.
3. **In-app check-in / Sunday mode** — for anyone in the app anyway; also
   feeds the staff board and attendance.

**Transport (current): Sendblue** on the IBS line +1 931 871 0392 —
GCC_SMS_PROVIDER=sendblue, reuses the existing SENDBLUE_* secrets, iMessage
blue-bubble with automatic SMS fallback, no 10DLC wait. Two plan constraints
shape it: outbound only reaches people who texted the line first (the app's
one-tap "JOIN <code>" text, handled by gcc-sms-inbound, opens the channel and
stamps phone_e164 + sms_opened_at), and ~200 follow-ups/day/line — ample for
the demo and staff pilot, and exactly why the church's own line (dedicated
Sendblue line ~$100/mo or Telnyx 10DLC number) is a hard cost in the
proposal. Flip GCC_SMS_PROVIDER=telnyx when that line exists; the JOIN step
then becomes optional instead of required.

Gates before any SMS goes out: GCC_SMS_ENABLED=true and (on the Telnyx path
later) 10DLC approval + auto-recharge ON. All functions no-op safely until
then. ⚠ Before registering the gcc-sms-inbound webhook, check the collision
with ibs-giveaway-sms (see its DEPLOY.md).

## Not built yet (deliberate)

- Email/SMS sends (needs Resend sender + Telnyx number decisions)
- Staff reply-from-board (v2)
- Grace AI hooks (Grace reads these same tables when she moves onto IBS infra)
