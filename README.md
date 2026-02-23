# Guest Manager

A modern web application for managing events, guests, and ticket check-ins.

## 🚀 Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org) (App Router)
- **Database**: [Supabase PostgreSQL](https://supabase.com) with [Drizzle ORM](https://orm.drizzle.team)
- **Authentication**: Supabase Auth (via standard middleware)
- **API**: [tRPC](https://trpc.io) (v11) for type-safe API communication
- **Styling**: [Tailwind CSS 4+](https://tailwindcss.com) with [shadcn/ui](https://ui.shadcn.com)
- **Payments**: [Stripe](https://stripe.com)
- **Email**: [Resend](https://resend.com)

## 📁 Project Structure

```text
src/
├── app/            # App router (Pages, Layouts, API routes)
├── components/     # UI Components (shared, layout, feature-specific)
├── lib/            # Shared libraries (Supabase, Stripe, utils)
├── server/         # Server-side logic
│   ├── db/         # Database schema and migrations
│   ├── trpc/       # tRPC routers and procedures
│   └── actions/    # Server Actions for form handling
├── providers/      # React context providers (Query, tRPC, Theme)
└── middleware.ts   # Auth and session middleware
```

## 🛠️ Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Environment Variables**:
   Create a `.env.local` file with the required Supabase, Stripe, and Resend keys (see `.env.example`).

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Database Management**:
   ```bash
   npm run db:generate  # Generate migrations
   npm run db:push      # Push schema to DB
   npm run db:studio    # Open Drizzle Studio
   ```

## 📄 License

MIT
