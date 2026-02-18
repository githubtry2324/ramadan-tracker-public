# Quran Race - Ramadan Tracker

A gamified Quran reading tracker for families during Ramadan. Track juz completions, see leaderboards, celebrate khatams!

## Features

- **Multi-family support** - Create separate trackers for different families
- **30 Juz tracking** - Visual progress bar for each participant
- **Khatam tracking** - Multiple rounds with different colors
- **Real-time sync** - Updates appear instantly for all users
- **Ramadan countdown** - Color-coded progress (green → yellow → red for the 3 phases)
- **Confetti celebrations** - Every 5 juz and full khatam
- **Mobile-first** - Add to home screen for app-like experience
- **Admin dashboard** - Create families, get invite links

## Quick Start

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to SQL Editor and run the schema from `supabase-schema.sql`
3. Get your project URL and anon key from Settings > API

### 2. Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/ramadan-tracker-public)

### 3. Set Environment Variables

In Vercel project settings, add:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_ADMIN_PASSWORD=your-secret-password
```

### 4. Create Your First Family

1. Go to `/admin` on your deployed site
2. Enter your admin password
3. Create a family (e.g., "Khan Family" with slug "khan")
4. Copy the link `/family/khan` and share with your family!

## URLs

- `/` - Landing page
- `/admin` - Admin dashboard (password protected)
- `/family/[slug]` - Family tracker page

## Tech Stack

- Next.js 15
- Tailwind CSS
- Supabase (PostgreSQL + Realtime)
- Vercel hosting

## Customization

### Change Ramadan Start Date

Edit `src/components/QuranTracker.tsx`:

```typescript
const RAMADAN_START = new Date(2026, 1, 17) // Feb 17, 2026
```

### Admin Password

Set via environment variable `NEXT_PUBLIC_ADMIN_PASSWORD` (default: "admin123")

## License

MIT - Use freely for your family and community!

---

Built with love for Ramadan 1447 / 2026
