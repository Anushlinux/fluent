/**
 * Analysis Mode utilities for managing on-demand page analysis state
 */

export interface AnalysisModeState {
  active: boolean;      // Are terms currently highlighted?
  analyzing: boolean;   // Is scan animation running?
}

const STORAGE_KEY = 'analysisMode';

/**
 * Get the current Analysis Mode state
 */
export async function getAnalysisState(): Promise<AnalysisModeState> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] || { active: false, analyzing: false };
  } catch (error) {
    console.error('[Fluent] Failed to get Analysis Mode state:', error);
    return { active: false, analyzing: false };
  }
}

/**
 * Set the Analysis Mode state
 */
export async function setAnalysisState(state: AnalysisModeState): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: state });
    console.log(`[Fluent] Analysis Mode updated:`, state);
  } catch (error) {
    console.error('[Fluent] Failed to set Analysis Mode state:', error);
    throw error;
  }
}

/**
 * Start analysis (set analyzing flag)
 */
export async function startAnalysis(): Promise<void> {
  await setAnalysisState({ active: false, analyzing: true });
}

/**
 * Complete analysis (set active flag, clear analyzing)
 */
export async function completeAnalysis(): Promise<void> {
  await setAnalysisState({ active: true, analyzing: false });
}

/**
 * Clear analysis (reset both flags)
 */
export async function clearAnalysis(): Promise<void> {
  await setAnalysisState({ active: false, analyzing: false });
}

