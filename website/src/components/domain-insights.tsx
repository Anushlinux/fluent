'use client';

import React, { useState, useEffect } from 'react';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase';
import { TrendingUp, BookOpen, Lightbulb } from 'lucide-react';

interface DomainInsightsProps {
  context: string;
  userId: string;
}

interface Insight {
  id: string;
  insight_type: string;
  content: string;
  metadata: any;
  created_at: string;
}

export function DomainInsights({ context, userId }: DomainInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      loadInsights();
    } else {
      setLoading(false);
    }
  }, [context, userId]);

  const loadInsights = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('insights')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('[Domain Insights] Failed to load:', error.message);
        setInsights([]);
      } else {
        // Filter insights by context
        const contextInsights = (data || []).filter(insight => 
          insight.metadata?.cluster === context || 
          insight.metadata?.context === context
        );
        setInsights(contextInsights);
      }
    } catch (error) {
      console.error('[Domain Insights] Error loading:', error);
      setInsights([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isSupabaseConfigured() || insights.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-yellow-500" />
        <h3 className="text-lg font-semibold text-foreground-primary">
          Insights for {context}
        </h3>
      </div>

      <div className="space-y-3">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className="rounded-xl border border-border bg-background-primary p-4 transition-all hover:border-primary/30"
          >
            <div className="flex items-start gap-3">
              {insight.insight_type === 'gap_detected' && (
                <TrendingUp className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              )}
              {insight.insight_type === 'learning_path' && (
                <BookOpen className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm text-foreground-secondary">{insight.content}</p>
                <p className="mt-1 text-xs text-foreground-secondary/70">
                  {new Date(insight.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

