import { useEffect, useState } from 'react';
import { calculateStats, type UserStats } from '../../utils/stats';
import { getAnalysisState, type AnalysisModeState } from '../../utils/analysisMode';
import { checkAuthState, signOut, openLoginPage, type AuthState } from '../../utils/auth';
import { initializeSupabase } from '../../utils/supabase';
import { getLogs } from '../../utils/logger';
import './App.css';

export default function App() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysisState, setAnalysisState] = useState<AnalysisModeState>({ active: false, analyzing: false });
  const [authState, setAuthState] = useState<AuthState>({ isAuthenticated: false, user: null, session: null });
  const [recentTerms, setRecentTerms] = useState<string[]>([]);

  useEffect(() => {
    initializeApp();

    // Listen for auth state changes
    const authListener = (message: any) => {
      if (message.action === 'authStateChanged') {
        console.log('[Fluent Popup] Auth state changed, reloading data');
        loadData();
      }
    };

    chrome.runtime.onMessage.addListener(authListener);

    // Return cleanup function
    return () => {
      chrome.runtime.onMessage.removeListener(authListener);
    };
  }, []);

  const initializeApp = async () => {
    await initializeSupabase();
    await loadData();
  };

  const loadData = async () => {
    try {
      const [statsData, analysisStateData, auth, logsData] = await Promise.all([
        calculateStats(),
        getAnalysisState(),
        checkAuthState(),
        getLogs(),
      ]);

      setStats(statsData);
      setAnalysisState(analysisStateData);
      setAuthState(auth);
      
      // Get recent unique terms
      const uniqueTerms = Array.from(
        new Set(logsData.slice(-10).map(log => log.term))
      ).slice(0, 5);
      setRecentTerms(uniqueTerms);
    } catch (error) {
      console.error('[Fluent] Failed to load data:', error);
    } finally {
      setLoading(false);
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

  const handleLogin = () => {
    openLoginPage();
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setAuthState({ isAuthenticated: false, user: null, session: null });
    } catch (error: any) {
      console.error('[Fluent] Failed to log out:', error);
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header__top">
          <h1 className="header__title">Fluent</h1>
          {authState.isAuthenticated ? (
            <div className="header__auth">
              <span className="auth-email">{authState.user?.email}</span>
              <button className="auth-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <button className="auth-login" onClick={handleLogin}>
              <span className="auth-icon">→</span>
              Auto-Sync
            </button>
          )}
        </div>
        <p className="header__subtitle">Your Web3 learning companion</p>
      </header>

      {/* Main Content */}
      <main className="main">
        {/* Hero Stat Card */}
        {stats && (
          <div className="hero-card">
            <div className="hero-card__content">
              <div className="hero-card__icon">📚</div>
              <div className="hero-card__value">{stats.totalXP}</div>
              <div className="hero-card__label">Total Experience Points</div>
              <div className="hero-card__meta">
                <div className="hero-meta">
                  <span className="hero-meta__icon">🔥</span>
                  <span className="hero-meta__value">{stats.currentStreak}</span>
                  <span className="hero-meta__label">Day Streak</span>
                </div>
                <div className="hero-meta">
                  <span className="hero-meta__icon">📝</span>
                  <span className="hero-meta__value">{stats.termsLearnedToday}</span>
                  <span className="hero-meta__label">Today</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Terms Glassmorphic Preview */}
        {recentTerms.length > 0 && (
          <div className="recent-preview">
            <div className="recent-preview__header">
              <span className="recent-preview__icon">✨</span>
              <span className="recent-preview__title">Recently Learned</span>
            </div>
            <div className="recent-preview__terms">
              {recentTerms.slice(0, 3).map((term, index) => (
                <div key={index} className="recent-preview__term">
                  {term}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analyze Button */}
        <button 
          className={`analyze-button ${analysisState.analyzing ? 'analyze-button--analyzing' : ''}`}
          onClick={handleAnalyzeClick}
          disabled={analysisState.analyzing}
        >
          <span className="analyze-icon">
            {analysisState.analyzing ? '⏳' : '✨'}
          </span>
          <span className="analyze-text">
            {analysisState.analyzing ? 'Analyzing page...' : 'Analyze this page'}
          </span>
        </button>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>Learn Web3 as you browse</p>
      </footer>
    </div>
  );
}

