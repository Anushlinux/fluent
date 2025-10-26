# Google OAuth Setup Guide

This guide explains how to set up Google OAuth authentication for Fluent using Supabase.

## Prerequisites

- A Supabase account and project
- A Google Cloud Console account

## Step 1: Set Up Google Cloud Console

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Select **External** for user type
   - Fill in the required information:
     - App name: **Fluent**
     - User support email: Your email
     - Developer contact information: Your email
   - Add scopes: `email`, `profile`
   - Add your email as a test user (for testing)
   - Save and continue

6. Create the OAuth client ID:
   - Application type: **Web application**
   - Name: **Fluent Web**
   - **Authorized redirect URIs**: 
     ```
     https://your-project-id.supabase.co/auth/v1/callback
     ```
   - Add the redirect URI above (replace `your-project-id` with your Supabase project ID)
   - Click **Create**

7. Copy the **Client ID** and **Client Secret**

## Step 2: Configure Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **Google** in the list and click **Enable**
5. Paste your Google **Client ID** and **Client Secret**
6. The **Redirect URL** should already be filled in correctly
7. Click **Save**

### Additional Configuration

Optionally, you can configure additional settings in Supabase:

- **Auto Confirm**: Enable this to skip email confirmation for OAuth users
- **Allowed Redirect URLs**: Add your production domain URLs here

## Step 3: Test Google OAuth

1. Start your development server:
   ```bash
   cd website
   npm run dev
   ```

2. Navigate to `http://localhost:3000/login`

3. Click the **"Continue with Google"** button

4. You should be redirected to Google's sign-in page

5. After signing in, you'll be redirected back to your application

6. The user should be automatically logged in with their Google account

## Troubleshooting

### "Redirect URI mismatch"

**Problem**: Google shows "Redirect URI mismatch" error

**Solution**: 
1. Make sure you added the exact redirect URI from Supabase to Google Cloud Console
2. The redirect URI format is: `https://your-project-id.supabase.co/auth/v1/callback`
3. Find your project ID in Supabase Dashboard > Settings > API > Project URL

### "Invalid client ID"

**Problem**: "Invalid client ID" error in browser console

**Solution**:
1. Verify you copied the correct Client ID and Client Secret
2. Make sure there are no extra spaces when pasting into Supabase
3. Check that Google OAuth provider is enabled in Supabase

### OAuth window closes immediately

**Problem**: The OAuth flow starts but immediately closes

**Solution**:
1. Check browser console for errors
2. Verify redirect URI is set correctly in both Google Cloud and Supabase
3. Check that `NEXT_PUBLIC_SUPABASE_URL` is set in your environment variables
4. Make sure the Google provider is enabled in Supabase Dashboard

### Profile not created after OAuth sign-in

**Problem**: User signs in with Google but profile is not created in database

**Solution**:
1. Check that the `profiles` table exists in Supabase
2. Verify RLS policies allow inserts
3. Check browser console for any errors during profile creation
4. The auth callback route should automatically create profiles for OAuth users

## Security Best Practices

1. **Never commit credentials**: Keep your Client ID and Client Secret secure
2. **Use environment variables**: Store sensitive data in `.env.local`
3. **Enable HTTPS in production**: Google OAuth requires HTTPS in production
4. **Test on multiple browsers**: OAuth behavior can vary by browser
5. **Monitor OAuth usage**: Check Supabase Dashboard > Logs for authentication errors

## Production Deployment

When deploying to production:

1. **Update Redirect URIs** in Google Cloud Console:
   - Add your production domain: `https://yourdomain.com/auth/callback`
   
2. **Update Supabase Settings**:
   - Add production URLs to allowed redirect URLs
   - Update site URL in Supabase Dashboard > Settings > Authentication

3. **Set Environment Variables** on your hosting platform:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

## Testing on Different Environments

- **Local development**: `http://localhost:3000`
- **Preview deployments**: Add your preview URL to Google Cloud Console
- **Production**: Add your production URL to both Google Cloud Console and Supabase

## Additional OAuth Providers

You can enable other OAuth providers in Supabase:

- GitHub
- Azure
- Apple
- Discord
- Facebook
- Twitter
- Twitch

To add another provider:
1. Follow similar setup steps in the provider's developer console
2. Configure in Supabase Dashboard > Authentication > Providers
3. Update the UI to add provider buttons (similar to Google)

## User Experience Improvements

The current implementation includes:

✅ **Visual improvements**: Google logo in OAuth button
✅ **Better UX**: Loading states during authentication
✅ **Error handling**: Clear error messages for users
✅ **Automatic profile creation**: Profiles are created automatically for OAuth users
✅ **Responsive design**: Works on all screen sizes
✅ **Consistent styling**: Matches your app's design system

## Next Steps

After setting up Google OAuth:

1. Test the complete sign-in flow
2. Test the sign-up flow
3. Test profile creation after OAuth
4. Add more OAuth providers if needed
5. Customize the UI further if desired

## Support

If you encounter issues:

1. Check the browser console for errors
2. Check Supabase Dashboard > Logs
3. Verify your Google Cloud Console settings
4. Review this guide for common issues
5. Check Supabase documentation: https://supabase.com/docs/guides/auth


