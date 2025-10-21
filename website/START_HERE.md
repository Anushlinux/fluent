# 🚀 START HERE - Fluent Knowledge Graph Setup

## ⚠️ Current Status: Setup Required

Your graph website needs Supabase to be configured. This takes about **5 minutes**.

## 🎯 Quick Setup (Follow These Steps)

### 1️⃣ Create Supabase Account
- Visit: https://supabase.com
- Sign up (it's free!)
- Create a new project

### 2️⃣ Get Your Credentials
- In Supabase dashboard: **Project Settings** → **API**
- Copy these two values:
  - Project URL (e.g., `https://xxxxx.supabase.co`)
  - anon/public key (starts with `eyJ...`)

### 3️⃣ Add Credentials to .env.local
Edit the file `website/.env.local` and replace:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...your-actual-key-here
```

### 4️⃣ Create Database Tables
- In Supabase: **SQL Editor** → **New query**
- Copy SQL from `../SUPABASE_SETUP.md`
- Run all three sections:
  1. Create Tables
  2. Row Level Security Policies  
  3. Trigger for Profile Creation

### 5️⃣ Restart Server
```bash
cd website
npm run dev
```

Visit: http://localhost:3001

## 📚 More Information

- **Quick Reference**: `SETUP_CHECKLIST.md` (step-by-step checklist)
- **Detailed Guide**: `SETUP.md` (full instructions)
- **Database Setup**: `../SUPABASE_SETUP.md` (SQL schema)
- **What Was Fixed**: `../FIXES_APPLIED.md` (summary of changes)

## 🎨 Want to See the UI First?

Just run `npm run dev` now to see the new setup screen in your browser!
It will guide you through the setup process visually.

## ✅ You'll Know It's Working When:

1. No yellow warning box on the website
2. You can sign up / log in
3. You can load demo data or upload JSON files
4. The graph visualizes without errors

## 💡 Tip

The website will automatically detect when Supabase is configured.
Once set up, you won't need to do this again!

---

**Ready?** Start with step 1 above or open `SETUP_CHECKLIST.md` for a detailed checklist!
