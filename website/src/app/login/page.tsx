'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
          router.push('/');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [router, supabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Authentication not configured');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        // Check if profile exists, create if not
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.session.user.id)
          .single();
        
        if (!existingProfile) {
          // Create profile if it doesn't exist
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{ id: data.session.user.id, email: data.session.user.email }]);
          
          if (profileError) {
            console.error('Failed to create profile:', profileError);
          }
        }

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

        // Redirect to main page
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground-primary mb-2">
            Welcome Back
          </h1>
          <p className="text-foreground-primary/70">
            Sign in to visualize your knowledge graph
          </p>
        </div>

        <div className="bg-background border border-border rounded-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
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
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-foreground-primary/70">
              Don't have an account?{' '}
              <Link
                href="/signup"
                className="font-medium text-foreground-primary hover:text-foreground-primary/80 underline"
              >
                Sign up
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

