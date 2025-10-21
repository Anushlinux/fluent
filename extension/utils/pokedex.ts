/**
 * Pokédex utilities for tracking term lock/unlock states and collection progress
 */

export interface TermUnlockState {
  [term: string]: {
    unlocked: boolean;
    unlockedAt?: string;
    quizCompleted?: boolean;
    quizCompletedAt?: string;
  };
}

export interface PokedexStats {
  totalTerms: number;
  unlockedTerms: number;
  quizzesCompleted: number;
  percentComplete: number;
  byCategory: {
    [category: string]: {
      total: number;
      unlocked: number;
    };
  };
}

const STORAGE_KEY = 'termUnlockState';

/**
 * Get the unlock state for all terms
 */
export async function getTermUnlockState(): Promise<TermUnlockState> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] || {};
  } catch (error) {
    console.error('[Fluent] Failed to get term unlock state:', error);
    return {};
  }
}

/**
 * Unlock a term (mark as viewed)
 */
export async function unlockTerm(term: string): Promise<void> {
  try {
    const state = await getTermUnlockState();
    
    if (!state[term]?.unlocked) {
      state[term] = {
        ...state[term],
        unlocked: true,
        unlockedAt: new Date().toISOString(),
      };
      
      await chrome.storage.local.set({ [STORAGE_KEY]: state });
      console.log(`[Fluent] Unlocked term: ${term}`);
    }
  } catch (error) {
    console.error('[Fluent] Failed to unlock term:', error);
  }
}

/**
 * Mark a term's quiz as completed
 */
export async function markQuizCompleted(term: string): Promise<void> {
  try {
    const state = await getTermUnlockState();
    
    state[term] = {
      ...state[term],
      unlocked: true,
      unlockedAt: state[term]?.unlockedAt || new Date().toISOString(),
      quizCompleted: true,
      quizCompletedAt: new Date().toISOString(),
    };
    
    await chrome.storage.local.set({ [STORAGE_KEY]: state });
    console.log(`[Fluent] Quiz completed for term: ${term}`);
  } catch (error) {
    console.error('[Fluent] Failed to mark quiz completed:', error);
  }
}

/**
 * Check if a term is unlocked
 */
export async function isTermUnlocked(term: string): Promise<boolean> {
  const state = await getTermUnlockState();
  return state[term]?.unlocked ?? false;
}

/**
 * Get Pokédex statistics
 */
export async function getPokedexStats(glossary: Array<{ term: string; category?: string }>): Promise<PokedexStats> {
  const state = await getTermUnlockState();
  
  const totalTerms = glossary.length;
  const unlockedTerms = glossary.filter(entry => state[entry.term]?.unlocked).length;
  const quizzesCompleted = glossary.filter(entry => state[entry.term]?.quizCompleted).length;
  const percentComplete = totalTerms > 0 ? Math.round((unlockedTerms / totalTerms) * 100) : 0;
  
  // Calculate by category
  const byCategory: { [category: string]: { total: number; unlocked: number } } = {};
  
  glossary.forEach(entry => {
    const category = entry.category || 'General';
    
    if (!byCategory[category]) {
      byCategory[category] = { total: 0, unlocked: 0 };
    }
    
    byCategory[category].total++;
    if (state[entry.term]?.unlocked) {
      byCategory[category].unlocked++;
    }
  });
  
  return {
    totalTerms,
    unlockedTerms,
    quizzesCompleted,
    percentComplete,
    byCategory,
  };
}

/**
 * Initialize term unlock state (all terms unlocked by default for existing users)
 */
export async function initializeTermUnlockState(glossary: Array<{ term: string }>): Promise<void> {
  const state = await getTermUnlockState();
  
  // Check if we need to initialize (if state is empty, assume new user)
  if (Object.keys(state).length === 0) {
    // For new users, all terms start unlocked (backward compatibility)
    const initialState: TermUnlockState = {};
    glossary.forEach(entry => {
      initialState[entry.term] = {
        unlocked: true,
        unlockedAt: new Date().toISOString(),
      };
    });
    
    await chrome.storage.local.set({ [STORAGE_KEY]: initialState });
    console.log('[Fluent] Initialized term unlock state for', glossary.length, 'terms');
  }
}

