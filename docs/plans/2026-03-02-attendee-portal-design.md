# Attendee Portal Design

**Date:** 2026-03-02
**Status:** Approved
**Scope:** Attendee-facing portal (web + mobile), organizer web QR scanner

---

## 1. Overview

Add a self-service **Attendee Portal** to the Guest Manager platform. Attendees create accounts, see their event history, view their ticket QR code, browse event agendas, see fellow guests, message organizers, and receive change notifications. Organizers get a browser-based QR scanner that pairs with existing device infrastructure.

---

## 2. Auth Architecture (Approach A — Separate Realms)

Two completely separate auth flows sharing one Supabase project:

| Realm | Login URL | Post-login destination | Role in user_metadata |
|-------|-----------|----------------------|----------------------|
| Organizer | `/login` | `/dashboard` | `organizer` |
| Attendee | `/attendee/login` | `/attendee/dashboard` | `attendee` |

**Auth methods (both realms):** Email + password, Google OAuth.

**Account linking:** When an attendee signs up, their email is matched against `tickets.attendeeEmail` and `orders.email`. All past events auto-appear — no data migration required.

**Middleware logic:**
- `/attendee/*` routes — require Supabase session with `role: attendee`
- `/dashboard/*` routes — require Supabase session with `role: organizer` + valid `companyId`
- If an organizer accidentally hits `/attendee/login` → redirect to `/dashboard`

---

## 3. Data Model

### New Tables

#### `attendee_profiles`
Links a Supabase auth user to their identity and enables email-based ticket lookup.

```
id                uuid PK
supabase_user_id  uuid UNIQUE NOT NULL   -- Supabase auth.users.id
email             varchar(255) NOT NULL  -- matched to tickets.attendeeEmail
display_name      varchar(255)
avatar_url        text
created_at        timestamp
updated_at        timestamp
```

#### `event_agenda_items`
Per-event agenda managed by organizers, visible to attendees.

```
id            uuid PK
event_id      uuid FK → events(id)
company_id    uuid FK → companies(id)
title         varchar(255) NOT NULL
description   text
location      varchar(255)
starts_at     timestamp
ends_at       timestamp
speaker_name  varchar(255)
speaker_bio   text
sort_order    integer DEFAULT 0
created_at    timestamp
updated_at    timestamp
```

#### `attendee_messages`
Per-event chat threads between one attendee and the organizer.

```
id                   uuid PK
event_id             uuid FK → events(id)
company_id           uuid FK → companies(id)
attendee_profile_id  uuid FK → attendee_profiles(id)
sender_type          varchar(20)  -- 'attendee' | 'organizer'
sender_id            uuid         -- attendee_profiles.id or users.id
sender_name          varchar(255)
message              text NOT NULL
read_at              timestamp    -- null = unread
created_at           timestamp
```

#### `attendee_notifications`
In-app notifications triggered by organizer actions or event changes.

```
id                   uuid PK
event_id             uuid FK → events(id)
company_id           uuid FK → companies(id)
attendee_profile_id  uuid FK → attendee_profiles(id)
type                 varchar(50)  -- 'event_updated' | 'time_changed' |
                                  -- 'venue_changed' | 'cancelled' | 'message'
title                varchar(255) NOT NULL
body                 text
read_at              timestamp    -- null = unread
created_at           timestamp
```

### Existing Tables Used (unchanged)
- `tickets` — `barcode`, `attendeeEmail`, `status`, `pdfUrl`, `walletUrl`
- `orders` — `email`, `orderNumber`, event history
- `guests` — attendance state, checkedInAt
- `events` — title, date, venue, cover image
- `devices` + `device_pair_tokens` — reused for web scanner pairing

---

## 4. Routes

### Attendee Portal (`/attendee/*`)

| Route | Description |
|-------|-------------|
| `/attendee/login` | Sign in — email/password or Google OAuth |
| `/attendee/signup` | Create account — name, email, password or Google |
| `/attendee/dashboard` | Notification bell, upcoming events, past events |
| `/attendee/events` | Full event history (upcoming + past) |
| `/attendee/events/[eventId]` | Event detail with 4 tabs (see below) |
| `/attendee/profile` | Name, avatar, password change, notification prefs |

### Event Detail Tabs (`/attendee/events/[eventId]`)

**Ticket tab**
- Large QR code (barcode value from `tickets.barcode`)
- Ticket type, attendee name, status badge
- "Add to Wallet" button (if `walletUrl` exists)
- "Download PDF" button (if `pdfUrl` exists)

**Agenda tab**
- Timeline list sorted by `starts_at`
- Each item: time range, title, speaker name, location
- Managed by organizer via dashboard

**Guests tab**
- Grid of all attendees for the event (name + avatar initial only)
- No email/contact info exposed — names only
- Total attendee count

**Messages tab**
- Chat-style thread between this attendee and the organizer
- Unread count badge on tab
- Sending a message creates an `attendee_messages` record
- Organizer reply triggers `attendee_notifications`

### Organizer Additions

| Route | Description |
|-------|-------------|
| `/dashboard/events/[id]/scan` | Browser-based camera QR scanner |
| `/dashboard/events/[id]/messages` | Inbox — all attendee conversations |
| Agenda tab added to existing event overview | Add/edit/reorder agenda items |

---

## 5. Organizer Web Scanner

Reuses existing `devices` + `device_pair_tokens` infrastructure.

**Pairing flow:**
1. Organizer opens `/dashboard/events/[id]/devices` → generates Access Code + PIN (existing modal)
2. Staff member opens `/dashboard/events/[id]/scan` on their phone browser
3. Prompted: enter Access Code + PIN **or** scan the pairing QR
4. On success: device JWT stored in `localStorage`, scanner activates

**Active scanner UI:**
- Full-screen camera viewfinder
- Green overlay + attendee name on valid scan
- Red overlay + reason on invalid (voided, expired)
- Yellow overlay + "Already checked in at HH:MM" on duplicate
- Manual barcode entry fallback
- Top bar: event name, checked-in count
- "Unpair device" button

---

## 6. tRPC Routers (New)

### `attendeeAuth` router
- `getProfile` — fetch attendee_profile by supabase_user_id
- `upsertProfile` — create or update profile on sign-in

### `attendeeEvents` router (attendee-protected procedures)
- `list` — all events linked to attendee's email (via tickets + orders)
- `get` — event detail + ticket for this attendee

### `attendeeAgenda` router
- `list` — agenda items for an event (public — visible to any attendee of that event)

### `attendeeGuests` router
- `list` — other attendees for an event (names + avatars only)

### `attendeeMessages` router
- `list` — conversation thread for this attendee + event
- `send` — send a message → triggers notification to organizer

### `attendeeNotifications` router
- `list` — notifications for this attendee
- `markRead` — mark one or all as read

### `agenda` router (organizer — protected)
- `list`, `create`, `update`, `delete`, `reorder` — full CRUD for agenda items

### `organizerMessages` router (organizer — protected)
- `listConversations` — all attendee threads for an event (with unread counts)
- `getThread` — messages in one attendee's thread
- `reply` — send reply → creates attendee_notification

---

## 7. Middleware Updates

`src/lib/supabase/middleware.ts` updated to:
- Protect `/attendee/*` — redirect to `/attendee/login` if no session or wrong role
- Allow organizer session holders on `/attendee/login` to redirect to `/dashboard`
- Keep existing `/dashboard/*` protection unchanged

---

## 8. Mobile App (React Native)

The existing mobile app is organizer/device-only. Adding attendee support:

- New "Attendee" tab in the app bottom nav
- Attendees sign in with same `/attendee` Supabase auth
- Shows same 4 tabs: Ticket QR, Agenda, Guests, Messages
- Uses same tRPC attendee routers
- Notifications via Expo push notifications (future: Supabase Realtime)

---

## 9. Implementation Phases

**Phase 1 — Foundation**
- DB schema: 4 new tables + Drizzle migration
- Middleware update for dual realms
- `/attendee/login` + `/attendee/signup` pages

**Phase 2 — Attendee Portal Core**
- tRPC attendee routers
- `/attendee/dashboard` — notifications + event list
- `/attendee/events/[eventId]` — Ticket + Agenda + Guests + Messages tabs
- `/attendee/profile`

**Phase 3 — Organizer Tools**
- Agenda CRUD in dashboard event pages
- Messages inbox in dashboard
- Organizer broadcast notifications

**Phase 4 — Web Scanner**
- `/dashboard/events/[id]/scan` with pairing flow
- Camera QR scanning using existing scan API

**Phase 5 — Mobile**
- Attendee auth + tabs in React Native app
- Push notification integration

---

## 10. Key Decisions & Constraints

- **Email as identity bridge** — no foreign keys added to existing tables; email lookup is sufficient and avoids a migration
- **Names-only guest list** — privacy default; no contact info exposed between attendees
- **No new device table** — web scanner reuses `devices` + `pair_tokens` exactly as mobile does
- **Notifications are in-app only** — email notifications are out of scope for this phase
- **zod v3** — maintain compatibility with tRPC v11 (no zod v4)
- **attendeeProcedure** — new tRPC middleware reads `attendee_profiles` by `supabase_user_id`, similar to how `protectedProcedure` reads `companyId`
