# Crummey Notice Manager

A self-hosted platform for automating Crummey notice generation, delivery, and acknowledgment tracking for irrevocable trusts.

## What are Crummey Notices?

Crummey notices are legal notifications sent to beneficiaries of irrevocable trusts (typically ILITs - Irrevocable Life Insurance Trusts) informing them of their right to withdraw contributions made to the trust. These notices are required to qualify gifts to the trust for the annual gift tax exclusion.

## Features

- **Trust Management** - Create and manage multiple irrevocable trusts
- **Beneficiary Management** - Add beneficiaries with support for minors (guardian notifications)
- **Contribution Tracking** - Log one-time or recurring contributions (monthly, quarterly, annually)
- **Automatic Notice Generation** - Notices auto-generated when contributions are recorded
- **Email Delivery** - Send notices via Resend with unique acknowledgment links
- **Digital Acknowledgment** - Beneficiaries acknowledge via secure link (no login required)
- **PDF Archives** - Generate PDF copies of notices for record-keeping
- **Audit Trail** - Complete compliance record of all activities

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Magic Link)
- **Email**: Resend
- **PDF**: @react-pdf/renderer
- **Styling**: Tailwind CSS
- **Hosting**: Railway, Vercel, or self-hosted

## Project Structure

```
crummey-manager/
├── src/
│   ├── app/
│   │   ├── (auth)/                 # Login page
│   │   ├── (dashboard)/            # Protected routes
│   │   │   ├── dashboard/          # Overview
│   │   │   ├── trusts/             # Trust CRUD
│   │   │   └── notices/            # Notice management
│   │   ├── acknowledge/[token]/    # Public acknowledgment
│   │   └── api/                    # API routes
│   ├── components/
│   │   ├── ui/                     # Sidebar, Header
│   │   └── trusts/                 # Trust-specific components
│   ├── lib/
│   │   ├── supabase/               # Database clients
│   │   ├── email/                  # Email templates
│   │   └── pdf/                    # PDF generation
│   └── types/                      # TypeScript interfaces
├── supabase/
│   └── migrations/                 # Database schema
└── .env.example
```

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account (free tier works)
- Resend account for email delivery

### Setup

1. **Clone and install**
   ```bash
   git clone <repo>
   cd crummey-manager
   npm install
   ```

2. **Configure Supabase**
   - Create a new Supabase project
   - Run the migration in `supabase/migrations/001_initial_schema.sql` via SQL Editor
   - Copy your project URL and keys

3. **Configure Resend**
   - Create a Resend account
   - Add and verify your domain
   - Get your API key

4. **Set environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   RESEND_API_KEY=re_your_api_key
   FROM_EMAIL=notices@yourdomain.com
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Open** http://localhost:3000

## Deployment

### Railway

1. Connect your repository to Railway
2. Add environment variables
3. Deploy

### Vercel

1. Import project to Vercel
2. Add environment variables
3. Deploy

## Usage Flow

1. **Login** - Enter email, click magic link
2. **Create Trust** - Add trust details and trustee information
3. **Add Beneficiaries** - Add beneficiaries (supports minors with guardians)
4. **Record Contribution** - Enter amount, date, optional recurring schedule
5. **Send Notices** - Review and send pending notices
6. **Track Acknowledgments** - Monitor which beneficiaries have acknowledged

## Recurring Contributions

The platform supports scheduled recurring contributions:
- **Monthly** - Same day each month
- **Quarterly** - Every 3 months
- **Annually** - Same date each year

When a recurring contribution is set up, the system will generate notices automatically on each scheduled date.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/trusts | List user's trusts |
| POST | /api/trusts | Create trust |
| GET | /api/trusts/[id] | Get trust details |
| GET | /api/beneficiaries | List beneficiaries |
| POST | /api/beneficiaries | Add beneficiary |
| GET | /api/contributions | List contributions |
| POST | /api/contributions | Record contribution |
| GET | /api/notices | List notices |
| POST | /api/notices/send | Send pending notices |
| GET | /api/notices/[id]/pdf | Download notice PDF |
| GET | /api/acknowledge/[token] | Get notice for acknowledgment |
| POST | /api/acknowledge/[token] | Submit acknowledgment |

## Security

- Row Level Security (RLS) ensures users only access their own data
- Magic link authentication (no passwords)
- Public acknowledgment pages use unique tokens
- All actions logged to audit trail

## License

MIT
