# Claude Code Instructions - Crummey Notice Manager

## What's Built (Skeleton)

### Database Schema (`supabase/migrations/001_initial_schema.sql`)
- `profiles` - User accounts
- `trusts` - Irrevocable trusts with trustee info
- `beneficiaries` - Trust beneficiaries with minor/guardian handling
- `contributions` - Gifts made to trusts
- `notices` - Individual Crummey notices per beneficiary per contribution
- `audit_log` - Complete audit trail for IRS compliance
- Auto-trigger: Creating a contribution auto-generates notices for all active beneficiaries
- Row Level Security policies for all tables

### API Routes
- `POST /api/trusts` - Create trust
- `GET /api/trusts` - List user's trusts
- `POST /api/beneficiaries` - Add beneficiary to trust
- `GET /api/beneficiaries?trust_id=X` - List beneficiaries
- `PUT /api/beneficiaries` - Update beneficiary
- `DELETE /api/beneficiaries?id=X` - Soft delete (deactivate)
- `POST /api/contributions` - Record contribution (triggers notice generation)
- `GET /api/contributions?trust_id=X` - List contributions with notices
- `POST /api/notices/send` - Send pending notices via email
- `GET /api/notices` - List notices with filters
- `GET /api/acknowledge/[token]` - Public: Get notice for acknowledgment
- `POST /api/acknowledge/[token]` - Public: Submit acknowledgment

### Frontend Pages
- `/acknowledge/[token]` - Public acknowledgment page (complete)

### Libraries
- `src/lib/supabase/client.ts` - Supabase client config
- `src/lib/email/send-notice.ts` - Email templates and sending via Resend

## What Needs Building

### Priority 1: Auth
```
src/app/(auth)/login/page.tsx
src/app/(auth)/register/page.tsx
src/middleware.ts  # Protect dashboard routes
```

### Priority 2: Dashboard Core
```
src/app/(dashboard)/layout.tsx  # Sidebar navigation
src/app/(dashboard)/dashboard/page.tsx  # Overview/stats
```

### Priority 3: Trust Management UI
```
src/app/(dashboard)/trusts/page.tsx  # List trusts
src/app/(dashboard)/trusts/new/page.tsx  # Create trust form
src/app/(dashboard)/trusts/[id]/page.tsx  # Trust detail view
src/app/(dashboard)/trusts/[id]/beneficiaries/page.tsx  # Manage beneficiaries
```

### Priority 4: Contribution Flow
```
src/app/(dashboard)/trusts/[id]/contributions/page.tsx  # List contributions
src/app/(dashboard)/trusts/[id]/contributions/new/page.tsx  # Record new contribution
```

### Priority 5: Notice Management
```
src/app/(dashboard)/notices/page.tsx  # All notices across trusts
src/app/(dashboard)/notices/pending/page.tsx  # Pending notices to send
```

### Priority 6: Reporting
```
src/app/(dashboard)/reports/page.tsx  # Exportable reports for tax records
src/lib/pdf/generate-notice.ts  # PDF generation for archive
```

## Key UX Flows

### 1. Initial Setup
User → Login → Create Trust → Add Beneficiaries → Ready to receive contributions

### 2. Record Contribution
User → Select Trust → Enter amount/date → System auto-generates notices → User sends notices

### 3. Beneficiary Acknowledgment
Email received → Click link → View notice details → Type name → Submit → Recorded

### 4. Compliance Check
User → View notices by trust → See pending/sent/acknowledged status → Export for records

## Technical Notes

### Email Sending
Currently uses Resend. For self-hosted, replace with:
- Nodemailer + SMTP
- Amazon SES
- Postmark

### PDF Generation
Not implemented. Options:
- `@react-pdf/renderer` for React-based PDFs
- `puppeteer` for HTML-to-PDF
- `pdf-lib` for programmatic generation

### Scheduled Jobs (for reminders)
Options:
- Supabase Edge Functions with pg_cron
- Vercel Cron
- External cron + API call

## Environment Setup

1. Create Supabase project
2. Run migration SQL in Supabase SQL Editor
3. Set up Resend account
4. Copy .env.example to .env.local and fill values
5. `npm install && npm run dev`

## Testing the Acknowledgment Flow

1. Create a notice manually in the database
2. Get the `acknowledgment_token` UUID
3. Visit `/acknowledge/{token}`
4. Verify the flow works
