import React, { useEffect, useState } from 'react';
import { calculateStats, exportAsJSON, exportAsMarkdown, type UserStats } from '../../utils/stats';
import { getLogs, type LogEntry } from '../../utils/logger';
import { getAnalysisState, type AnalysisModeState } from '../../utils/analysisMode';
import PokedexView from './PokedexView';
import './App.css';

interface TermsByDate {
  [date: string]: Set<string>;
}

interface GlossaryEntry {
  term: string;
  category?: string;
  definition?: string;
  definitions?: { [context: string]: string };
  [key: string]: any;
}

type ViewType = 'dashboard' | 'pokedex';

export default function App() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [termsByDate, setTermsByDate] = useState<TermsByDate>({});
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [analysisState, setAnalysisState] = useState<AnalysisModeState>({ active: false, analyzing: false });
  const [glossary, setGlossary] = useState<GlossaryEntry[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, logsData, analysisStateData, glossaryData] = await Promise.all([
        calculateStats(),
        getLogs(),
        getAnalysisState(),
        loadGlossary(),
      ]);

      setStats(statsData);
      setLogs(logsData);
      setAnalysisState(analysisStateData);
      setGlossary(glossaryData);

      // Group terms by date
      const grouped: TermsByDate = {};
      logsData.forEach(log => {
        const date = log.timestamp.split('T')[0];
        if (!grouped[date]) {
          grouped[date] = new Set();
        }
        grouped[date].add(log.term);
      });

      setTermsByDate(grouped);
    } catch (error) {
      console.error('[Fluent] Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGlossary = async (): Promise<GlossaryEntry[]> => {
    try {
      const glossaryUrl = chrome.runtime.getURL('glossary.json');
      const response = await fetch(glossaryUrl);
      return await response.json();
    } catch (error) {
      console.error('[Fluent] Failed to load glossary:', error);
      return [];
    }
  };

  const handleAnalyzeClick = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.id) {
      console.error('[Fluent] No active tab found');
      return;
    }

    if (!analysisState.active && !analysisState.analyzing) {
      // Start analysis
      setAnalysisState({ active: false, analyzing: true });
      
      chrome.tabs.sendMessage(tab.id, { action: 'analyzePage' }, () => {
        // Reload state after analysis completes
        loadData();
      });
    } else if (analysisState.active) {
      // Clear analysis
      chrome.tabs.sendMessage(tab.id, { action: 'clearAnalysis' }, () => {
        setAnalysisState({ active: false, analyzing: false });
      });
    }
  };

  const handleExportJSON = () => {
    const json = exportAsJSON(logs);
    downloadFile(json, 'fluent-logs.json', 'application/json');
  };

  const handleExportMarkdown = () => {
    const markdown = exportAsMarkdown(logs);
    downloadFile(markdown, 'fluent-logs.md', 'text/markdown');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  const sortedDates = Object.keys(termsByDate).sort().reverse();

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header__top">
          <div className="header__logo">
            <img src="/icon.svg" alt="Fluent Logo" width="40" height="40" />
            <h1 className="header__title">Fluent</h1>
          </div>
        </div>
        <p className="header__subtitle">Web3 Learning Platform</p>
        
        {/* Analyze Button */}
        <div className="header__analyze">
          <button 
            className={`analyze-button ${analysisState.analyzing ? 'analyze-button--analyzing' : ''} ${analysisState.active ? 'analyze-button--active' : ''}`}
            onClick={handleAnalyzeClick}
            disabled={analysisState.analyzing}
          >
            <span className="analyze-button__icon">
              {analysisState.analyzing ? '✨' : analysisState.active ? '✕' : '🔍'}
            </span>
            <span className="analyze-button__text">
              {analysisState.analyzing ? 'Analyzing...' : analysisState.active ? 'Clear Analysis' : 'Analyze Page'}
            </span>
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div className="header__tabs">
          <button 
            className={`header__tab ${currentView === 'dashboard' ? 'header__tab--active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={`header__tab ${currentView === 'pokedex' ? 'header__tab--active' : ''}`}
            onClick={() => setCurrentView('pokedex')}
          >
            📚 Pokédex
          </button>
        </div>
      </header>

      {/* Main Content */}
      {currentView === 'dashboard' && (
        <>
          {/* Stats Cards */}
          {stats && (
            <div className="stats">
          <div className="stat-card stat-card--primary">
            <div className="stat-card__value">{stats.totalXP}</div>
            <div className="stat-card__label">Total XP</div>
          </div>

          <div className="stat-card stat-card--secondary">
            <div className="stat-card__value">
              {stats.currentStreak}
              <span className="stat-card__unit">🔥</span>
            </div>
            <div className="stat-card__label">Day Streak</div>
          </div>

          <div className="stat-card">
            <div className="stat-card__value">{stats.termsLearnedToday}</div>
            <div className="stat-card__label">Terms Today</div>
          </div>

          <div className="stat-card">
            <div className="stat-card__value">{stats.uniqueTermsSeen}</div>
            <div className="stat-card__label">Unique Terms</div>
          </div>

          <div className="stat-card">
            <div className="stat-card__value">{stats.accuracy}%</div>
            <div className="stat-card__label">Quiz Accuracy</div>
          </div>

          <div className="stat-card">
            <div className="stat-card__value">{stats.totalQuizzesTaken}</div>
            <div className="stat-card__label">Quizzes Taken</div>
          </div>
        </div>
      )}

      {/* Terms List */}
      <div className="section">
        <h2 className="section__title">Learning History</h2>

        {logs.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__text">
              No terms learned yet. Browse the web and discover Web3 terms!
            </p>
            <p className="empty-state__hint">
              Terms will be automatically highlighted on any webpage.
            </p>
          </div>
        ) : (
          <div className="terms-list">
            {sortedDates.map(date => (
              <div key={date} className="terms-group">
                <div className="terms-group__header">
                  <span className="terms-group__date">{formatDate(date)}</span>
                  <span className="terms-group__count">
                    {termsByDate[date].size} {termsByDate[date].size === 1 ? 'term' : 'terms'}
                  </span>
                </div>
                <div className="terms-group__items">
                  {Array.from(termsByDate[date]).map(term => {
                    const termLogs = logs.filter(
                      log => log.term === term && log.timestamp.split('T')[0] === date
                    );
                    const quizLog = termLogs.find(log => log.quizResult !== undefined);

                    return (
                      <div key={term} className="term-item">
                        <div className="term-item__header">
                          <span className="term-item__name">{term}</span>
                          {quizLog && (
                            <span
                              className={`term-item__badge ${
                                quizLog.quizResult
                                  ? 'term-item__badge--correct'
                                  : 'term-item__badge--incorrect'
                              }`}
                            >
                              {quizLog.quizResult ? '✓' : '✗'}
                              {quizLog.xp ? ` +${quizLog.xp} XP` : ''}
                            </span>
                          )}
                        </div>
                        {termLogs[0]?.contextSentence && (
                          <div className="term-item__context">
                            "{termLogs[0].contextSentence.slice(0, 100)}
                            {termLogs[0].contextSentence.length > 100 ? '...' : ''}"
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export Section */}
      {logs.length > 0 && (
        <div className="section">
          <h2 className="section__title">Export Data</h2>
          <div className="export-buttons">
            <button className="button button--secondary" onClick={handleExportJSON}>
              📄 Export as JSON
            </button>
            <button className="button button--secondary" onClick={handleExportMarkdown}>
              📝 Export as Markdown
            </button>
          </div>
        </div>
      )}
        </>
      )}

      {/* Pokédex View */}
      {currentView === 'pokedex' && (
        <PokedexView glossary={glossary} />
      )}

      {/* Footer */}
      <footer className="footer">
        <p className="footer__text">
          Keep learning! Hover over highlighted terms or click for quizzes.
        </p>
      </footer>
    </div>
  );
}

/**
 * Format date string for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateStr = date.toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (dateStr === todayStr) {
    return 'Today';
  } else if (dateStr === yesterdayStr) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}

