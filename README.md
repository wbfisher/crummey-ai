# Crummey Notice Manager

A self-hosted solution for managing Crummey notices for irrevocable trusts.

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Email**: Resend (or self-hosted alternative)
- **Hosting**: Railway, Vercel, or self-hosted

## Core Features

1. **Trust Management** - Create and manage irrevocable trusts
2. **Beneficiary Management** - Add/edit beneficiaries per trust
3. **Contribution Tracking** - Log gifts/contributions to trusts
4. **Automatic Notice Generation** - Auto-create and schedule notices on contribution entry
5. **Email Delivery** - Send notices with unique acknowledgment links
6. **Digital Acknowledgment** - Beneficiaries acknowledge via secure link
7. **Audit Trail** - Complete record of all notices, delivery timestamps, and acknowledgments

## Project Structure

```
crummey-manager/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth routes (login, register)
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   │   ├── trusts/        # Trust CRUD
│   │   │   ├── beneficiaries/ # Beneficiary management
│   │   │   ├── contributions/ # Contribution entry
│   │   │   └── notices/       # Notice history/status
│   │   ├── acknowledge/[token]/ # Public acknowledgment page
│   │   └── api/               # API routes
│   │       ├── trusts/
│   │       ├── beneficiaries/
│   │       ├── contributions/
│   │       ├── notices/
│   │       └── webhooks/      # Email delivery webhooks
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── forms/             # Form components
│   │   └── tables/            # Data table components
│   ├── lib/
│   │   ├── supabase/          # Supabase client config
│   │   ├── email/             # Email service
│   │   ├── pdf/               # PDF generation for notices
│   │   └── utils/             # Helper functions
│   └── types/                 # TypeScript types
├── supabase/
│   └── migrations/            # Database migrations
├── .env.example
├── package.json
└── README.md
```

## Database Schema

See `supabase/migrations/` for full schema.

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
npx supabase db push

# Start development server
npm run dev
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
```
