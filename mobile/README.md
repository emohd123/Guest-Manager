# Events Hub Mobile (Expo)

## Quick Start

1. `cd mobile`
2. `npm install`
3. Set `EXPO_PUBLIC_API_URL` only when testing against a non-production API
4. `npm run start`

## Included Screens

- Auth choice for staff and visitors
- Staff pairing with token, access code plus PIN, or QR token
- Event summary and guest list
- Ticket scanning with camera or manual entry
- Walk-up registration
- Activity and sync status

## Offline Foundation

- SQLite guest cache: `src/storage/guestCache.ts`
- SQLite mutation queue: `src/storage/offlineQueue.ts`
- Replay loop with `clientMutationId`: `src/sync/replay.ts`

## Release Profiles

- `beta`: Google Play Internal Testing and iPhone TestFlight
- `production`: public store release

Commands:

```bash
npx eas-cli build --platform android --profile beta
npx eas-cli build --platform ios --profile beta
npx eas-cli submit --platform android --profile beta
npx eas-cli submit --platform ios --profile beta
```
