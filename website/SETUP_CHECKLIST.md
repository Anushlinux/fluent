# Fluent Graph Setup Checklist

Use this checklist to set up your Fluent Knowledge Graph website:

## ☐ Step 1: Create Supabase Project (2 minutes)

- [ ] Go to https://supabase.com
- [ ] Click "New Project"
- [ ] Choose organization (or create one)
- [ ] Enter project name: `fluent-graph` (or your choice)
- [ ] Enter database password (save it!)
- [ ] Select region closest to you
- [ ] Click "Create new project"
- [ ] Wait for project to finish setting up

## ☐ Step 2: Get Credentials (30 seconds)

- [ ] In Supabase dashboard, click on your project
- [ ] Go to **Settings** (gear icon in sidebar)
- [ ] Click **API** section
- [ ] Copy **Project URL** (looks like: `https://xxxxx.supabase.co`)
- [ ] Copy **anon public key** (long string starting with `eyJ...`)

## ☐ Step 3: Configure Environment (1 minute)

- [ ] Open `website/.env.local` in your code editor
- [ ] Replace `https://your-project.supabase.co` with your actual Project URL
- [ ] Replace `your-anon-key-here` with your actual anon key
- [ ] Save the file

Your file should look like:
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## ☐ Step 4: Create Database Tables (2 minutes)

- [ ] In Supabase, click **SQL Editor** in sidebar
- [ ] Click "New query"
- [ ] Open `SUPABASE_SETUP.md` from the project root
- [ ] Copy the **"Create Tables"** SQL section
- [ ] Paste into Supabase SQL Editor
- [ ] Click "Run" (or press Ctrl+Enter)
- [ ] Verify success (should see "Success. No rows returned")

Repeat for:
- [ ] Copy and run **"Row Level Security (RLS) Policies"** section
- [ ] Copy and run **"Trigger for Profile Creation"** section

## ☐ Step 5: Configure Authentication (Optional but Recommended)

- [ ] In Supabase, go to **Authentication** → **Settings**
- [ ] Under "Auth Providers", ensure **Email** is enabled
- [ ] Scroll to **Email Templates**
- [ ] (Optional) Customize confirmation email
- [ ] Under **URL Configuration**, add:
  - Site URL: `http://localhost:3001`
  - Redirect URLs: `http://localhost:3001/auth/callback`

## ☐ Step 6: Start Development Server

- [ ] Open terminal
- [ ] Navigate to website folder: `cd website`
- [ ] Stop any running dev server (Ctrl+C)
- [ ] Start fresh: `npm run dev`
- [ ] Wait for "Ready" message

## ☐ Step 7: Test the Website

- [ ] Open browser to http://localhost:3001
- [ ] You should **NOT** see the yellow warning box anymore
- [ ] Click **"Sign Up"** button
- [ ] Enter email and password
- [ ] Create account
- [ ] You should be redirected to the upload screen

## ☐ Step 8: Test Graph Upload

Choose one:

**Option A: Demo Data**
- [ ] Click "Load Demo Data" button
- [ ] Wait for graph to load
- [ ] You should see a graph with 3 sentences and 2 topics

**Option B: Your Own Data**
- [ ] Export data from Fluent browser extension
- [ ] Click or drag the JSON file to upload area
- [ ] Wait for graph to load
- [ ] Explore your knowledge graph!

## 🎉 Success Checklist

You're all set up when you can:
- [ ] Sign up/login without errors
- [ ] Upload or load demo data
- [ ] See the interactive graph
- [ ] Click nodes to see details
- [ ] Use filters and quick views
- [ ] No error messages in browser console

## 🆘 Troubleshooting

### "Supabase environment variables not configured"
- ✅ Check that `.env.local` exists in `website` folder
- ✅ Verify the values are your actual credentials (not placeholders)
- ✅ Restart the dev server

### "Failed to insert nodes" or "table does not exist"
- ✅ Make sure you ran ALL THREE SQL sections from SUPABASE_SETUP.md
- ✅ Check Supabase → Database → Tables to verify tables exist
- ✅ Look for: `graph_nodes`, `graph_edges`, `captured_sentences`, `profiles`

### "User not authenticated"
- ✅ Make sure you signed up and logged in first
- ✅ Check that email confirmation is disabled (or confirm your email)
- ✅ Try signing out and back in

### Email confirmation required
- ✅ In Supabase: Authentication → Settings
- ✅ Disable "Enable email confirmations" for development
- ✅ Or check your email for confirmation link

### Still stuck?
1. Check browser console for detailed errors (F12 → Console)
2. Check `website/SETUP.md` for detailed instructions
3. Review `SUPABASE_SETUP.md` for database setup
4. Verify all SQL queries ran successfully in Supabase

## 📝 Notes

- The setup only needs to be done once
- Your data persists in Supabase (won't be lost)
- You can deploy this to Vercel/Netlify later
- The free Supabase tier is sufficient for personal use

## ✅ Completion

When everything works:
- [ ] Bookmark http://localhost:3001
- [ ] Install Fluent browser extension (if not already)
- [ ] Start capturing sentences and building your graph!

**Total setup time: ~5-10 minutes**

Congratulations! Your Fluent Knowledge Graph is ready to use! 🚀

