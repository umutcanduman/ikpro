# İKPro — Turkey's Modular HR Platform

Full-stack Next.js 14 + PostgreSQL + Prisma app.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js (credentials + Google)
- **Styling**: Tailwind CSS
- **Payments**: Stripe (ready, needs keys)
- **Language**: TypeScript

---

## Quick Start

### 1. Prerequisites

- Node.js 18+
- PostgreSQL running locally (or use Supabase/Neon free tier)

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment

```bash
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/ikpro"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Create the database

```bash
# Create DB (if using local Postgres)
createdb ikpro

# Push Prisma schema
npm run db:push

# Seed module data
npm run db:seed
```

### 5. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## User Flow

```
/ (landing)
  └─ /signup
       ├─ Step 1: Name, email, password
       └─ Step 2: Company name, industry, size
            └─ /onboarding/modules?companyId=xxx
                 └─ /onboarding/checklist?companyId=xxx
                      └─ /dashboard
```

---

## Project Structure

```
ikpro/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── signup/route.ts
│   │   └── modules/activate/route.ts
│   ├── onboarding/
│   │   ├── modules/page.tsx       ← Module picker
│   │   └── checklist/page.tsx     ← Onboarding checklist
│   ├── dashboard/page.tsx
│   ├── layout.tsx
│   ├── page.tsx                   ← Landing page
│   └── globals.css
├── components/
│   └── auth/AuthProvider.tsx
├── lib/
│   ├── auth.ts                    ← NextAuth config
│   ├── modules.ts                 ← Module definitions + pricing logic
│   └── prisma.ts                  ← DB client singleton
├── prisma/
│   ├── schema.prisma              ← Full DB schema
│   └── seed.ts                    ← Seed 9 modules
└── ...config files
```

---

## Database Schema

Key models:
- `Company` — tenant (one per customer)
- `User` — with roles: SUPER_ADMIN, COMPANY_ADMIN, MANAGER, EMPLOYEE
- `Module` — 9 module definitions
- `CompanyModule` — which modules a company has activated
- `Employee` — company employees
- `OnboardingProgress` — tracks signup funnel steps

---

## Modules & Pricing

| Module | Pricing |
|--------|---------|
| Core HR | Free (included) |
| Time & Leave | ₺20/emp/mo |
| Payroll | ₺35/emp/mo |
| ATS | ₺150/job post/mo |
| Performance | ₺25/emp/mo |
| LMS | ₺18/emp/mo |
| Engagement | ₺15/emp/mo |
| HR Analytics | ₺500/mo flat |
| KVKK | ₺300/mo flat |

Bundle discounts: 10–25% off.

---

## Next Steps to Build

1. **Employee CRUD** — `/dashboard/employees`
2. **Leave requests** — `/dashboard/time`
3. **Payroll run** — `/dashboard/payroll`
4. **Admin panel** — `/admin` (Super Admin view)
5. **Stripe integration** — billing & subscription management
6. **Email** — Resend for transactional emails
