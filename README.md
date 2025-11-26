# BetTrack NG - Premium Betting Tips Marketplace

A modern Telegram Mini App for buying and selling premium betting tickets in Nigeria. Built with Next.js 16, TypeScript, Tailwind CSS, and Supabase.

## Features

- 🎯 **Premium Tickets** - Buy verified betting tips from expert tipsters
- 💳 **Paystack Integration** - Secure payments in Nigerian Naira
- 🔐 **Telegram Authentication** - Seamless login via Telegram WebApp
- 📱 **Mobile-First Design** - Optimized for Telegram mobile app
- ✨ **Modern UI** - Clean, dark-themed interface with smooth animations
- 👥 **User Roles** - Users, Tipsters, and Admins
- 📊 **Purchase History** - Track your ticket purchases
- 🎨 **Tipster Studio** - Create and manage premium tips

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Payments**: Paystack
- **Authentication**: Telegram WebApp
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Paystack account (Nigerian business)
- Telegram Bot Token

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd bettrack-ng
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `env.example.txt` to `.env.local` and fill in your values:
   ```bash
   cp env.example.txt .env.local
   ```

   Required environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (keep secret!)
   - `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` - Paystack public key
   - `PAYSTACK_SECRET_KEY` - Paystack secret key (keep secret!)
   - `TELEGRAM_BOT_TOKEN` - Your Telegram bot token
   - `APP_ADMIN_TELEGRAM_IDS` - Comma-separated Telegram IDs of admins
   - `APP_JWT_SECRET` - Random string for JWT signing

4. **Set up database**

   Run the following SQL in your Supabase SQL editor:

   ```sql
   -- Users table
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     telegram_id TEXT UNIQUE NOT NULL,
     username TEXT,
     first_name TEXT,
     last_name TEXT,
     role TEXT DEFAULT 'user' CHECK (role IN ('user', 'tipster', 'admin')),
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Tipster profiles
   CREATE TABLE tipster_profiles (
     user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
     display_name TEXT NOT NULL,
     profile_photo_url TEXT,
     bio TEXT,
     is_approved BOOLEAN DEFAULT FALSE,
     is_verified BOOLEAN DEFAULT FALSE,
     total_tickets INTEGER DEFAULT 0,
     success_rate DECIMAL(5,2),
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Tickets
   CREATE TABLE tickets (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     tipster_id UUID REFERENCES users(id) ON DELETE CASCADE,
     type TEXT DEFAULT 'premium' CHECK (type IN ('free', 'premium')),
     title TEXT NOT NULL,
     description TEXT,
     total_odds DECIMAL(10,2) NOT NULL,
     bookmaker TEXT CHECK (bookmaker IN ('bet9ja', 'sportybet', '1xbet', 'betking', 'other')),
     confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 10),
     price INTEGER NOT NULL, -- in kobo
     booking_code TEXT NOT NULL,
     status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'void')),
     posted_at TIMESTAMPTZ DEFAULT NOW(),
     match_details JSONB
   );

   -- Purchases
   CREATE TABLE purchases (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
     buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
     payment_method TEXT DEFAULT 'paystack',
     payment_reference TEXT UNIQUE NOT NULL,
     payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
     amount_paid INTEGER NOT NULL, -- in kobo
     created_at TIMESTAMPTZ DEFAULT NOW(),
     completed_at TIMESTAMPTZ
   );

   -- Ratings
   CREATE TABLE ratings (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     rating INTEGER CHECK (rating BETWEEN 1 AND 5),
     comment TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     UNIQUE(ticket_id, user_id)
   );

   -- Indexes
   CREATE INDEX idx_tickets_tipster ON tickets(tipster_id);
   CREATE INDEX idx_tickets_posted_at ON tickets(posted_at DESC);
   CREATE INDEX idx_purchases_buyer ON purchases(buyer_id);
   CREATE INDEX idx_purchases_ticket ON purchases(ticket_id);
   CREATE INDEX idx_purchases_reference ON purchases(payment_reference);
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add all environment variables from `.env.local`
   - Deploy!

3. **Configure Telegram Bot**
   - Set your bot's menu button to open the Mini App
   - Use BotFather to configure: `/setmenubutton`
   - Set the URL to your Vercel deployment

## Project Structure

```
bettrack-ng/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── tickets/       # Ticket endpoints
│   │   ├── purchases/     # Purchase endpoints
│   │   ├── paystack/      # Payment verification
│   │   ├── user/          # User profile & purchases
│   │   └── studio/        # Tipster studio access
│   ├── t/[id]/           # Ticket detail page
│   ├── studio/           # Tipster creation page
│   ├── profile/          # User profile page
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── Navigation.tsx    # Bottom navigation
│   └── TicketCard.tsx    # Ticket card component
├── lib/                   # Utility functions
│   ├── errors.ts         # Error handling
│   ├── paystack.ts       # Paystack utilities
│   ├── supabaseAdmin.ts  # Supabase admin client
│   ├── supabaseClient.ts # Supabase client
│   ├── telegram.ts       # Telegram utilities
│   └── session.ts        # JWT session management
├── types/                 # TypeScript types
│   └── index.ts          # Centralized type definitions
├── middleware.ts          # Next.js middleware (auth)
└── package.json          # Dependencies
```

## Features Breakdown

### For Users
- Browse premium betting tips
- Purchase tickets with Paystack
- View booking codes after purchase
- Track purchase history
- View ticket status (won/lost/pending)

### For Tipsters
- Create premium tickets
- Set odds, confidence, and price
- Manage booking codes
- View tipster stats

### For Admins
- Approve tipster applications
- View all purchases
- Manage users

## Environment Setup

Make sure all environment variables are set in Vercel:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all variables from `.env.local`
4. Redeploy if needed

## Support

For issues or questions, contact the development team.

## License

Proprietary - All rights reserved
