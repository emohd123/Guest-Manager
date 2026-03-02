# Guest Manager Mobile V2 (Expo)

## Quick Start
1. `cd mobile`
2. `npm install`
3. Set API base URL in `app.json` (`expo.extra.apiBaseUrl`)
4. `npm run start`

## Included Screens
- Auth choice (staff token, access code + PIN, QR token)
- Event home summary
- Guest list with one-tap check-in/check-out
- Scan screen (camera + manual barcode)
- Walkup form
- Activity/sync status

## Offline Foundation
- SQLite guest cache (`src/storage/guestCache.ts`)
- SQLite mutation queue (`src/storage/offlineQueue.ts`)
- Idempotent replay loop using `clientMutationId` (`src/sync/replay.ts`)

