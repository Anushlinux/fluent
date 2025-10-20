/**
 * Logging utilities for tracking user interactions with terms and quizzes
 */

export interface LogEntry {
  term: string;
  url: string;
  timestamp: string;
  contextSentence?: string;
  quizResult?: boolean;
  xp?: number;
  streak?: number;
}

/**
 * Log when a popover is shown to the user
 */
export async function logPopoverView(
  term: string,
  url: string,
  contextSentence?: string
): Promise<void> {
  const logEntry: LogEntry = {
    term,
    url,
    timestamp: new Date().toISOString(),
    contextSentence,
  };

  const { logs = [] } = await chrome.storage.local.get('logs');
  logs.push(logEntry);
  await chrome.storage.local.set({ logs });
}

/**
 * Log quiz result and update XP and streak
 */
export async function logQuizResult(
  term: string,
  url: string,
  correct: boolean,
  contextSentence?: string
): Promise<void> {
  const xp = correct ? 10 : 0;
  const { logs = [], totalXP = 0 } = await chrome.storage.local.get(['logs', 'totalXP']);
  
  // Calculate streak
  const streak = await calculateStreak(logs);

  const logEntry: LogEntry = {
    term,
    url,
    timestamp: new Date().toISOString(),
    contextSentence,
    quizResult: correct,
    xp,
    streak,
  };

  logs.push(logEntry);
  const newTotalXP = totalXP + xp;
  
  await chrome.storage.local.set({ 
    logs,
    totalXP: newTotalXP
  });
}

/**
 * Calculate the current learning streak (consecutive days with at least 1 correct answer)
 */
async function calculateStreak(logs: LogEntry[]): Promise<number> {
  if (logs.length === 0) return 0;

  // Get logs with correct quiz results only
  const correctLogs = logs.filter(log => log.quizResult === true);
  if (correctLogs.length === 0) return 0;

  // Group by date
  const dateSet = new Set<string>();
  correctLogs.forEach(log => {
    const date = log.timestamp.split('T')[0];
    dateSet.add(date);
  });

  const sortedDates = Array.from(dateSet).sort().reverse();
  if (sortedDates.length === 0) return 0;

  // Calculate streak from today backwards
  const today = new Date().toISOString().split('T')[0];
  let streak = 0;
  let currentDate = new Date(today);

  for (let i = 0; i < sortedDates.length; i++) {
    const checkDate = currentDate.toISOString().split('T')[0];
    if (sortedDates.includes(checkDate)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Get logs for export
 */
export async function getLogs(): Promise<LogEntry[]> {
  const { logs = [] } = await chrome.storage.local.get('logs');
  return logs;
}

/**
 * Clear all logs (for testing or reset)
 */
export async function clearLogs(): Promise<void> {
  await chrome.storage.local.set({ logs: [], totalXP: 0 });
}

