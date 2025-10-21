# Fluent Graph Website - Setup Guide

## Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
cd website
npm install
```

### 2. Configure Supabase

#### A. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "New project"
3. Fill in project details and wait for creation (~2 minutes)

#### B. Get Your Credentials

1. In your Supabase dashboard, go to **Project Settings** → **API**
2. Copy these two values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

#### C. Create Environment File

Create a file called `.env.local` in the `website` folder:

```bash
# website/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-key-here
```

**Replace the values** with your actual credentials from step B.

### 3. Set Up Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the SQL from `../SUPABASE_SETUP.md` (sections: "Create Tables", "Row Level Security", and "Trigger for Profile Creation")
4. Click "Run" to execute

### 4. Start the Development Server

```bash
npm run dev
```

The site will be available at [http://localhost:3001](http://localhost:3001)

## Common Issues

### "Supabase environment variables not configured"

- Make sure `.env.local` file exists in the `website` folder
- Check that both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Restart the dev server after creating `.env.local`

### "Failed to insert nodes" or table errors

- You need to create the database tables in Supabase
- Follow step 3 above to run the SQL schema
- Make sure all three SQL sections are executed (tables, RLS policies, and trigger)

### "User not authenticated"

- You need to sign up/login first before uploading data
- Click "Sign Up" to create an account
- The email confirmation might be required (check Supabase Auth settings to disable for development)

## Testing Without Supabase Setup

If you want to quickly test the interface without setting up Supabase:

1. You can view the landing page and demo data without authentication
2. But to actually save/load your own data, Supabase setup is required

## Next Steps

Once setup is complete:

1. Click "Sign Up" to create an account
2. Sign in with your credentials
3. Click "Load Demo Data" to see a sample graph
4. Or upload your own JSON file exported from the Fluent extension

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key | `eyJ...` (long string) |

## Need Help?

- Check `../SUPABASE_SETUP.md` for detailed Supabase configuration
- Make sure you've run all SQL commands from the setup guide
- Verify your Supabase project is active and not paused
- Check browser console for detailed error messages

