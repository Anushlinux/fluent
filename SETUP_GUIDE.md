# Fluent - Complete Setup Guide

This guide will walk you through setting up the complete Fluent system with Supabase authentication and manual sync.

## Prerequisites

- Node.js 18+ and npm/pnpm
- Chrome or Chromium-based browser
- A Supabase account (free tier works!)

## Part 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in the project details:
   - **Name**: Choose a name (e.g., "fluent-knowledge-graph")
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your users
4. Wait for the project to be created (takes 1-2 minutes)

### 1.2 Execute Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the entire SQL script from `SUPABASE_SETUP.md` (starting from "-- Enable UUID extension")
3. Paste it into the SQL Editor
4. Click "Run" to execute
5. Verify all tables were created by going to **Database** → **Tables**

You should see:
- `profiles`
- `captured_sentences`
- `graph_nodes`
- `graph_edges`

### 1.3 Configure Authentication

1. Go to **Authentication** → **Providers** in Supabase dashboard
2. Ensure **Email** provider is enabled
3. Configure email templates if desired
4. Go to **Authentication** → **URL Configuration**
5. Add redirect URLs:
   - For local development: `http://localhost:3001/auth/callback`
   - For production: `https://yourdomain.com/auth/callback` (when you deploy)

### 1.4 Get API Credentials

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## Part 2: Website Setup

### 2.1 Install Dependencies

```bash
cd website
npm install
```

### 2.2 Configure Environment Variables

Create `website/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace with your actual Supabase credentials from Part 1.4.

### 2.3 Run Development Server

```bash
npm run dev
```

The website will be available at `http://localhost:3001`

### 2.4 Test Authentication

1. Open `http://localhost:3001`
2. Click "Sign Up"
3. Create an account with your email
4. Check your email for confirmation (if enabled)
5. Log in with your credentials

## Part 3: Extension Setup

### 3.1 Install Dependencies

```bash
cd extension
pnpm install
```

### 3.2 Configure Environment Variables

Create `extension/.env` (not .env.local):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_WEBSITE_URL=http://localhost:3001
```

Use the same Supabase credentials as the website.

### 3.3 Build Extension

```bash
pnpm run dev
```

This will build the extension and watch for changes.

### 3.4 Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Navigate to `extension/.output/chrome-mv3` and select it
5. The Fluent extension should now appear in your extensions list

### 3.5 Configure Extension Authentication

1. Click the Fluent extension icon in your browser toolbar
2. You should see a "🔐 Login to Sync" button
3. Click it to open the login page (will open in a new tab)
4. Log in with the account you created in Part 2.4
5. After login, return to the extension popup
6. You should now see your email and a "Sync" button

## Part 4: Usage Workflow

### 4.1 Capture Sentences

1. Browse any webpage
2. In the extension popup, click "Analyze Page" to highlight Web3 terms
3. Select any sentence on the page
4. A capture popover will appear with detected terms and context
5. Click "Confirm & Save" to capture the sentence
6. The sentence is saved locally in the extension

### 4.2 Sync to Cloud

1. Open the extension popup
2. You'll see "Sync X items" button
3. Click "Sync Now"
4. Wait for sync to complete (you'll see a success message)
5. Your data is now uploaded to Supabase

### 4.3 View Your Graph

1. Go to `http://localhost:3001` in your browser
2. Log in if not already logged in
3. Your knowledge graph will automatically load
4. You can:
   - Zoom and pan the graph
   - Filter by topic or framework
   - View statistics
   - Use pre-built queries

### 4.4 Real-Time Updates

- The website subscribes to real-time updates
- When you sync new data from the extension, the website graph updates automatically
- No need to refresh the page!

## Part 5: Production Deployment

### 5.1 Deploy Website

#### Option A: Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "New Project" and import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy!
6. Add the production URL to Supabase redirect URLs

#### Option B: Other Platforms

- **Netlify**: Similar to Vercel
- **Railway**: Good for full-stack apps
- **Self-hosted**: Use Docker or PM2

### 5.2 Update Extension for Production

1. Update `extension/.env`:
   ```env
   VITE_WEBSITE_URL=https://your-domain.com
   ```

2. Rebuild extension:
   ```bash
   pnpm run build
   ```

3. The production build will be in `extension/.output/chrome-mv3`

### 5.3 Publish Extension (Optional)

To publish on Chrome Web Store:

1. Create a Chrome Web Store developer account ($5 one-time fee)
2. Create a zip of your extension:
   ```bash
   pnpm run zip
   ```
3. Upload to Chrome Web Store
4. Fill in store listing details
5. Submit for review

## Part 6: Troubleshooting

### Extension Can't Connect to Supabase

**Problem**: "Supabase credentials not configured" error

**Solution**:
1. Verify `.env` file exists in `extension/` directory
2. Check that environment variables don't have extra quotes or spaces
3. Rebuild the extension: `pnpm run dev`
4. Reload the extension in `chrome://extensions/`

### Authentication Not Working

**Problem**: Can't log in or session not persisting

**Solution**:
1. Check that redirect URLs are configured in Supabase
2. Verify environment variables are correct
3. Clear browser cache and extension storage
4. Check browser console for specific error messages

### Sync Fails

**Problem**: "Sync failed" error when trying to sync

**Solution**:
1. Verify you're logged in (check extension popup)
2. Check browser console for detailed error
3. Ensure Supabase RLS policies are set up correctly
4. Verify user has permission to insert data (check Supabase logs)

### Graph Not Loading

**Problem**: Website shows "No data" after sync

**Solution**:
1. Check that sync completed successfully in extension
2. Verify data exists in Supabase (check `graph_nodes` table)
3. Check browser console for errors
4. Ensure user is logged in with same account
5. Try refreshing the page

### Real-Time Updates Not Working

**Problem**: Graph doesn't update automatically after sync

**Solution**:
1. Check that Realtime is enabled in Supabase project settings
2. Verify browser supports WebSockets
3. Check browser console for subscription errors
4. Try manually refreshing the page

## Part 7: Development Tips

### Hot Reload

- **Website**: Changes auto-reload with Next.js dev server
- **Extension**: Changes require page refresh (content scripts) or extension reload (popup/background)

### Debugging

- **Extension**: Use Chrome DevTools (right-click popup → Inspect)
- **Content Script**: Open page console with F12
- **Background**: Go to `chrome://extensions/` → Inspect views: background page
- **Website**: Standard browser DevTools

### Database Inspection

1. Go to Supabase dashboard → **Table Editor**
2. View captured sentences, graph nodes, and edges
3. Use **SQL Editor** to run custom queries
4. Check **Database** → **Roles** for RLS policies

### API Testing

Use Supabase dashboard or tools like:
- **Postman**: Test API endpoints
- **Supabase Client**: Use JS client in browser console
- **psql**: Direct PostgreSQL access

## Part 8: Next Steps

### Extend Functionality

- Add more graph visualization options
- Implement AI-powered insights
- Create collaborative features
- Add data export formats (PDF, PNG)

### Improve UX

- Add onboarding tutorial
- Create keyboard shortcuts
- Implement dark mode
- Add mobile support

### Scale Up

- Optimize database queries
- Add caching layer (Redis)
- Implement background sync
- Add batch operations

## Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review `SUPABASE_SETUP.md` for database setup
3. Check browser console for error messages
4. Verify environment variables are correct
5. Ensure Supabase project is active and not paused

## Security Notes

- Never commit `.env` or `.env.local` files
- The `anon` key is safe to use in client-side code
- RLS policies protect user data
- Use HTTPS in production
- Rotate keys if compromised

---

**Happy Learning!** 🚀

Build your knowledge graph with Fluent.

