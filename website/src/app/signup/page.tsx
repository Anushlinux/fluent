'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Authentication not configured');
      return;
    }

    setLoading(true);
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      if (data.user) {
        setSuccess(true);
        
        // Create profile record
        if (data.user.id) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{ id: data.user.id, email: data.user.email }]);
          
          if (profileError) {
            console.error('Failed to create profile:', profileError);
          }
        }
        
        // Auto-login if email confirmation is disabled
        if (data.session) {
          // Send session to extension if it's installed
          if (typeof window !== 'undefined') {
            window.postMessage(
              {
                type: 'FLUENT_AUTH_SUCCESS',
                session: {
                  access_token: data.session.access_token,
                  refresh_token: data.session.refresh_token,
                  user: data.session.user,
                },
              },
              window.location.origin
            );
          }

          router.push('/');
          router.refresh();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  if (success && !supabase?.auth.getSession()) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-background border border-border rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 border border-green-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground-primary mb-2">
              Check Your Email
            </h2>
            <p className="text-foreground-primary/70 mb-6">
              We've sent you a confirmation email. Please click the link to verify your account.
            </p>
            <Link href="/login">
              <Button>
                Go to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground-primary mb-2">
            Create Account
          </h1>
          <p className="text-foreground-primary/70">
            Start building your knowledge graph today
          </p>
        </div>

        <div className="bg-background border border-border rounded-2xl p-8">
          <form onSubmit={handleSignup} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground-primary mb-2"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground-primary mb-2"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
              />
              <p className="mt-1 text-xs text-foreground-primary/50">
                Must be at least 6 characters
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-foreground-primary mb-2"
              >
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-foreground-primary/70">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-foreground-primary hover:text-foreground-primary/80 underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm text-foreground-primary/60 hover:text-foreground-primary"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

