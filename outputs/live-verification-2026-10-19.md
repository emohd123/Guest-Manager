# Production verification — 19 October 2026

Target: https://www.iticket.info

This is a scoped live acceptance test, not a guarantee that every website or native-app feature has passed. The original observations below are followed by the subsequent fixes and signed-in testing.

## Verified

- All 26 HTTP checks in `scripts/live-flow-audit.mjs` returned their expected status. Public home, search, event, private-event, login, contact, privacy and terms pages responded. `/events` redirected home. Dashboard and scanner entry routes redirected unsigned users to login.
- Discovery returned 8 events; private-event listing returned 2 conferences; the seating endpoint responded successfully. Seats.io provisioning rejects GET with 405 as designed.
- Account summary, dashboard messages, mobile private data, checkout and scanner APIs rejected unauthenticated requests. Invalid conference credentials and an invalid promo code were rejected.
- Browser search for Hamlet returned one matching event. Saving it displayed exactly that event on Favourites; removing it restored the original local preference.
- Event media opened enlarged, advanced to the next image, and closed. Ticket quantity changed, the initial total displayed BHD 0.000, and checkout directed an unsigned buyer to login with a return URL.
- Demo attendee and speaker access returned 200. Their respective portal data loaded. An attendee was denied speaker portal access.
- One labelled demo Q&A question was submitted as Demo Attendee, received by Lina's demo speaker account with the attendee's name, and marked answered. That answered test question remains in the demo conference.
- The attendee browser portal rendered a QR pass, notices, speakers, the eight-session programme and resources. The generic shortcut bar was absent inside the portal. Back returned to the conference listing without an automatic redirect loop.
- Explicit conference sign-out returned to the conference listing successfully.
- A mobile-size viewport check found no document horizontal overflow on the attendee portal.
- Production `process_ticket_scan` assertions passed: first check-in, stored check-in state, duplicate rejection, wrong-event rejection, checkout, stored checkout state, expired-ticket rejection and voided-ticket rejection. All writes ran inside one transaction followed by ROLLBACK. A follow-up query confirmed zero remaining QA tickets.
- As the anonymous database role, tickets, guests, orders, application users, visitor messages and conference event rows were invisible, while published marketplace events remained visible. The test transaction was rolled back.
- TypeScript check passed. Vercel reported no grouped runtime errors in the selected one-hour window.

## Issues and inconsistencies found

1. **Conference expiry:** the demo conference ended on 16 October 2026, but valid attendee and speaker login still issued new tokens expiring approximately 12 hours after login on 19 October. `createPrivateEventAccess` falls back to 12 hours when the event end is in the past. This does not enforce the requested end-of-conference expiry.
2. **Conference localization:** Future Leaders Summit still displays Riyadh Front Exhibition & Conference Center and a Saudi Arabia map destination. The public Bahrain launch localization is incomplete for this demo conference.
3. **Conference re-entry:** after Back returns to `/private-event?browse=1`, clicking the conference's Open access page shows the credential form again despite a retained portal cookie. The explicit conference access page does not inspect the saved session.
4. **Price inconsistency:** search displays Bahrain Demo Event at BHD 75.000, while the actual event ticket panel offers the administration and VIP ticket types for free. Discovery and event ticket display should use a consistent price source.
5. **Demo configuration:** Bahrain Tech Summit is listed with Access code pending, so this listed conference cannot currently be entered through its card.

## Still requires a signed-in test session

The user authorized `info@onestonead.com` for tests. Database inspection confirms it has a company link and limited dashboard access. Its login page is open with the email filled in, awaiting the user's secure sign-in. The previous local test token has expired and no local service-role test credentials are configured.

- Company dashboard data, event subnavigation and scroll behavior under that account.
- Actual authenticated web scanner request, camera QR decoding, pairing/code-PIN flow, and device behavior.
- Complete free checkout, issued ticket/PDF, and paid checkout/payment confirmation.
- Organizer replies and attendee notifications.
- Full-admin conference editing, guest-list import, speaker/resource editing and normal dashboard editing require a full-access account in addition to this limited company account.
- Native APK behavior, permissions and device-camera tests were not performed. Mobile API checks do not establish full native app parity.

## Reproduction commands

Run `node scripts/live-flow-audit.mjs` for non-mutating public/auth rejection checks.

Run `node scripts/live-conference-audit.mjs` for demo-role login, portal data, role isolation and speaker-code redaction. Tokens are not printed. Q&A writes are disabled unless explicitly enabled with `LIVE_QA_WRITE=1`.

## Subsequent fixes and signed-in testing — 20 October

The earlier issues above have been addressed in this release:

- Conference login now rejects ended conferences. Protected requests also check the current published conference/end date, revoking older tokens after expiry or unpublishing. Seven local regression tests pass, covering expiry, malformed/forged tokens, revoked conference state, panel-speaker matching and credential redaction.
- Event-specific access pages reuse valid remembered sessions; the listing remains accessible with Back.
- Web/mobile discovery now respects free-event pricing. Private conferences are excluded from general mobile discovery.
- Co-presenters match individually and exactly. Read-only dashboard accounts cannot run any tRPC mutation, including bulk methods previously missed by name-based checks; scanning retains its separate authorization path.
- Attendee session/settings API responses and portal props omit speaker access codes without altering admin data.
- Checkout now displays persistent inline errors and immediate processing state, including during authentication.
- Future Leaders demo was refreshed to 5–6 November 2026, Exhibition World Bahrain, Sakhir, Asia/Bahrain, with matching programme dates and current resource links. Bahrain Tech Summit was refreshed to 12 November and access configured. Five named demo summit guests now have individual credentials, roles, position/company and valid QR tickets. No real-event records changed.

The user subsequently provided the signed-in full-access `kelany9@hotmail.com` session. Account/My Tickets, normal dashboard and separate conference dashboard loaded data; guest/session/Q&A and scanner code/PIN controls were visible. Existing scanner credentials were not replaced.

Signed-in checkout reached `/api/orders`. The server correctly rejected the demo VIP ticket with HTTP 400, `VIP sales have ended.` Its sales period ended on 30 September. No successful new order/payment is claimed.

Remaining acceptance limits: physical camera scanning, scanner pairing/PIN entry, actual paid checkout, successful free-ticket issuance/PDF delivery, company read-only browser flow, guest-list import, file uploads and organizer messaging were not exercised end-to-end. No native APK/AAB was rebuilt or device-tested in this release.

Post-deployment results will be appended once the production build is ready.
