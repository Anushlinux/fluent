import React, { useEffect, useState } from 'react';
import { getTermUnlockState, getPokedexStats, type PokedexStats } from '../../utils/pokedex';
import './PokedexView.css';

interface GlossaryEntry {
  term: string;
  category?: string;
  definition?: string;
  definitions?: { [context: string]: string };
}

interface PokedexViewProps {
  glossary: GlossaryEntry[];
}

type FilterType = 'all' | 'unlocked' | 'locked' | 'quizzed';

export default function PokedexView({ glossary }: PokedexViewProps) {
  const [unlockState, setUnlockState] = useState<Record<string, any>>({});
  const [stats, setStats] = useState<PokedexStats | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [glossary]);

  const loadData = async () => {
    const state = await getTermUnlockState();
    const pokedexStats = await getPokedexStats(glossary);
    setUnlockState(state);
    setStats(pokedexStats);
  };

  // Get unique categories
  const categories = ['all', ...new Set(glossary.map(entry => entry.category || 'General'))];

  // Filter terms
  const filteredTerms = glossary.filter(entry => {
    // Category filter
    if (categoryFilter !== 'all' && (entry.category || 'General') !== categoryFilter) {
      return false;
    }

    // Status filter
    const termState = unlockState[entry.term];
    if (filter === 'unlocked' && !termState?.unlocked) return false;
    if (filter === 'locked' && termState?.unlocked) return false;
    if (filter === 'quizzed' && !termState?.quizCompleted) return false;

    // Search filter
    if (searchQuery && !entry.term.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  const getTermDefinition = (entry: GlossaryEntry): string => {
    if (entry.definitions) {
      const firstContext = Object.keys(entry.definitions)[0];
      return entry.definitions[firstContext] || '';
    }
    return entry.definition || '';
  };

  return (
    <div className="pokedex-view">
      {/* Stats Header */}
      {stats && (
        <div className="pokedex-header">
          <div className="pokedex-header__title">
            <h2>Pokédex Collection</h2>
            <span className="pokedex-header__count">
              {stats.unlockedTerms} / {stats.totalTerms}
            </span>
          </div>
          <div className="pokedex-progress">
            <div className="pokedex-progress__bar">
              <div 
                className="pokedex-progress__fill"
                style={{ width: `${stats.percentComplete}%` }}
              />
            </div>
            <span className="pokedex-progress__text">{stats.percentComplete}% Complete</span>
          </div>
          <div className="pokedex-stats-mini">
            <span>✅ {stats.unlockedTerms} Unlocked</span>
            <span>📝 {stats.quizzesCompleted} Quizzed</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="pokedex-filters">
        <div className="pokedex-filters__row">
          <input
            type="text"
            placeholder="Search terms..."
            className="pokedex-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="pokedex-filters__row">
          <div className="pokedex-filter-group">
            <label>Status:</label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="pokedex-select"
            >
              <option value="all">All</option>
              <option value="unlocked">Unlocked</option>
              <option value="locked">Locked</option>
              <option value="quizzed">Quiz Completed</option>
            </select>
          </div>

          <div className="pokedex-filter-group">
            <label>Category:</label>
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pokedex-select"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === 'all' ? 'All' : cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="pokedex-results-count">
        Showing {filteredTerms.length} of {glossary.length} terms
      </div>

      {/* Term Cards Grid */}
      <div className="pokedex-grid">
        {filteredTerms.map(entry => {
          const termState = unlockState[entry.term];
          const isUnlocked = termState?.unlocked ?? false;
          const isQuizzed = termState?.quizCompleted ?? false;

          return (
            <div 
              key={entry.term} 
              className={`pokedex-card ${isUnlocked ? 'pokedex-card--unlocked' : 'pokedex-card--locked'}`}
            >
              <div className="pokedex-card__header">
                <div className="pokedex-card__status">
                  {isUnlocked ? (
                    <>
                      <span className="pokedex-card__icon">✓</span>
                      {isQuizzed && <span className="pokedex-card__quiz-badge">📝</span>}
                    </>
                  ) : (
                    <span className="pokedex-card__icon">🔒</span>
                  )}
                </div>
                <div className="pokedex-card__category">
                  {entry.category || 'General'}
                </div>
              </div>

              <div className="pokedex-card__body">
                <h3 className="pokedex-card__term">
                  {isUnlocked ? entry.term : '???'}
                </h3>
                <p className="pokedex-card__definition">
                  {isUnlocked 
                    ? getTermDefinition(entry).slice(0, 100) + (getTermDefinition(entry).length > 100 ? '...' : '')
                    : 'Find this term on a webpage to unlock it!'
                  }
                </p>
              </div>

              {isUnlocked && termState?.unlockedAt && (
                <div className="pokedex-card__footer">
                  Unlocked: {new Date(termState.unlockedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredTerms.length === 0 && (
        <div className="pokedex-empty">
          <p>No terms match your filters</p>
          <button 
            className="pokedex-empty__button"
            onClick={() => {
              setFilter('all');
              setCategoryFilter('all');
              setSearchQuery('');
            }}
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}

