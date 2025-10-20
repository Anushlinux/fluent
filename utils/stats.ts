/**
 * Statistics calculation utilities
 */

import type { LogEntry } from './logger';

export interface UserStats {
  totalXP: number;
  currentStreak: number;
  termsLearnedToday: number;
  uniqueTermsSeen: number;
  totalQuizzesTaken: number;
  correctAnswers: number;
  accuracy: number;
}

/**
 * Calculate comprehensive user statistics from logs
 */
export async function calculateStats(): Promise<UserStats> {
  const { logs = [], totalXP = 0 } = await chrome.storage.local.get(['logs', 'totalXP']);
  
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter((log: LogEntry) => 
    log.timestamp.split('T')[0] === today
  );

  const uniqueTermsToday = new Set(
    todayLogs.map((log: LogEntry) => log.term.toLowerCase())
  ).size;

  const uniqueTermsAllTime = new Set(
    logs.map((log: LogEntry) => log.term.toLowerCase())
  ).size;

  const quizLogs = logs.filter((log: LogEntry) => log.quizResult !== undefined);
  const correctAnswers = quizLogs.filter((log: LogEntry) => log.quizResult === true).length;
  const accuracy = quizLogs.length > 0 ? (correctAnswers / quizLogs.length) * 100 : 0;

  const currentStreak = await calculateCurrentStreak(logs);

  return {
    totalXP,
    currentStreak,
    termsLearnedToday: uniqueTermsToday,
    uniqueTermsSeen: uniqueTermsAllTime,
    totalQuizzesTaken: quizLogs.length,
    correctAnswers,
    accuracy: Math.round(accuracy),
  };
}

/**
 * Calculate current streak from logs
 */
async function calculateCurrentStreak(logs: LogEntry[]): Promise<number> {
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
 * Get unique terms learned today for badge
 */
export async function getUniqueTermsToday(): Promise<number> {
  const { logs = [] } = await chrome.storage.local.get('logs');
  const today = new Date().toISOString().split('T')[0];
  
  const todayLogs = logs.filter((log: LogEntry) => 
    log.timestamp.split('T')[0] === today
  );

  return new Set(todayLogs.map((log: LogEntry) => log.term.toLowerCase())).size;
}

/**
 * Export logs as JSON
 */
export function exportAsJSON(logs: LogEntry[]): string {
  return JSON.stringify(logs, null, 2);
}

/**
 * Export logs as Markdown
 */
export function exportAsMarkdown(logs: LogEntry[]): string {
  let markdown = '# Fluent Learning Log\n\n';
  markdown += `Generated: ${new Date().toLocaleString()}\n\n`;

  // Group logs by date
  const logsByDate: { [key: string]: LogEntry[] } = {};
  logs.forEach(log => {
    const date = log.timestamp.split('T')[0];
    if (!logsByDate[date]) {
      logsByDate[date] = [];
    }
    logsByDate[date].push(log);
  });

  // Sort dates descending
  const sortedDates = Object.keys(logsByDate).sort().reverse();

  sortedDates.forEach(date => {
    markdown += `## ${date}\n\n`;
    
    const uniqueTerms = new Set<string>();
    logsByDate[date].forEach(log => {
      uniqueTerms.add(log.term);
    });

    markdown += `**Terms learned:** ${uniqueTerms.size}\n\n`;

    uniqueTerms.forEach(term => {
      const termLogs = logsByDate[date].filter(log => log.term === term);
      const quizLog = termLogs.find(log => log.quizResult !== undefined);
      
      markdown += `- **${term}**`;
      
      if (quizLog) {
        markdown += ` - Quiz: ${quizLog.quizResult ? '✅ Correct' : '❌ Incorrect'} (+${quizLog.xp || 0} XP)`;
      }
      
      markdown += '\n';
      
      if (termLogs[0]?.contextSentence) {
        markdown += `  > ${termLogs[0].contextSentence}\n`;
      }
    });

    markdown += '\n';
  });

  return markdown;
}

