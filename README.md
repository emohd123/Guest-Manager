# Events Hub

A modern event operations platform for managing events, guests, ticketing, and check-ins.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org) App Router
- **Database**: [Supabase PostgreSQL](https://supabase.com) with [Drizzle ORM](https://orm.drizzle.team)
- **Authentication**: Supabase Auth
- **API**: [tRPC](https://trpc.io)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) with shadcn/ui
- **Payments**: [Stripe](https://stripe.com)
- **Email**: [Resend](https://resend.com)

## Project Structure

```text
src/
|-- app/            # App router pages, layouts, and API routes
|-- components/     # Shared, layout, and feature UI
|-- lib/            # Shared utilities and providers
|-- providers/      # React providers
|-- server/         # Server-side logic, routers, and actions
`-- middleware.ts   # Auth/session middleware
```

## Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` from `.env.example`.
3. Start local development:
   ```bash
   npm run dev
   ```
4. Run database tasks when needed:
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:studio
   ```

## Production Deploy

- Production web URL: `https://events-hub-vert.vercel.app`
- Privacy policy: `/privacy-policy`
- Terms of service: `/terms-of-service`
- Support/contact: `/contact`

Set the production environment variables in Vercel before deploying:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `NEXT_PUBLIC_APP_URL`
- `CHECKIN_APP_V2_ENABLED`
- `NEXT_PUBLIC_CHECKIN_APP_V2_ENABLED`
- `MOBILE_DEVICE_JWT_SECRET`
- `MOBILE_ONLINE_THRESHOLD_SECONDS`
- `MOBILE_PAIR_QR_TTL_SECONDS`
- `NEXT_PUBLIC_MOBILE_IOS_URL`
- `NEXT_PUBLIC_MOBILE_ANDROID_URL`

Deploy with:

```bash
npx vercel --prod
```

## License

MIT
