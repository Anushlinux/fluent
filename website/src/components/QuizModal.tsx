'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizQuestion {
  question: string;
  options: string[];
  correct: string; // 'a', 'b', 'c', or 'd'
  explanation: string;
}

interface QuizModalProps {
  domain: string;
  userId: string;
  onClose: () => void;
  onSuccess: (score: number, totalQuestions: number, questions: QuizQuestion[]) => void;
}

export function QuizModal({ domain, userId, onClose, onSuccess }: QuizModalProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch questions from ASI:One agent API
      const agentUrl = process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:8010';
      const response = await fetch(`${agentUrl}/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          gap_cluster: domain,
          difficulty: 2, // Default to medium difficulty
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quiz questions');
      }

      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (err: any) {
      console.error('[Quiz] Failed to load questions:', err);
      console.warn('[Quiz] Agent API not available. Using fallback questions for testing.');
      setError('Agent API offline - using demo questions');
      
      // Fallback: use demo questions
      setQuestions([
        {
          question: `What is a key concept in ${domain}?`,
          options: [
            'Decentralization',
            'Centralization',
            'Traditional banking',
            'None of the above',
          ],
          correct: 'a',
          explanation: `${domain} emphasizes decentralized systems and protocols.`,
        },
        {
          question: `Which of the following is a benefit of ${domain}?`,
          options: [
            'Transparency and trust',
            'Central control',
            'Limited access',
            'High fees',
          ],
          correct: 'a',
          explanation: `${domain} provides transparency and trustless interactions.`,
        },
        {
          question: `What technology underlies most ${domain} applications?`,
          options: [
            'Blockchain',
            'Traditional databases',
            'Spreadsheets',
            'Email servers',
          ],
          correct: 'a',
          explanation: `Blockchain technology is fundamental to ${domain} applications.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (option: string) => {
    if (showExplanation || quizCompleted) return;
    setSelectedAnswer(option);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return;

    const currentQuestion = questions[currentQuestionIndex];
    setShowExplanation(true);

    // Check if correct
    if (selectedAnswer === currentQuestion.correct) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct;
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    if (isLastQuestion) {
      // Quiz completed - trigger confetti and call onSuccess
      const percentage = Math.round(((isCorrect ? score + 1 : score) / questions.length) * 100);
      
      if (percentage >= 80) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      setQuizCompleted(true);
      onSuccess(isCorrect ? score + 1 : score, questions.length, questions);
    } else {
      // Next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const getOptionLetter = (index: number): string => {
    return ['a', 'b', 'c', 'd'][index] || 'a';
  };

  const getOptionClass = (optionLetter: string): string => {
    if (!showExplanation || quizCompleted) {
      return selectedAnswer === optionLetter ? 'selected' : '';
    }

    const currentQuestion = questions[currentQuestionIndex];
    if (optionLetter === currentQuestion.correct) {
      return 'correct';
    }

    if (optionLetter === selectedAnswer && optionLetter !== currentQuestion.correct) {
      return 'incorrect';
    }

    return 'faded';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-card rounded-lg p-8 text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-foreground-primary">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-card border border-border rounded-lg p-8 max-w-md">
          <button
            onClick={onClose}
            className="mb-4 flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground-primary"
          >
            <X className="h-4 w-4" />
            Close
          </button>
          <p className="text-red-500">{error}</p>
          <button
            onClick={loadQuestions}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-card rounded-lg p-8 text-center">
          <p className="text-foreground-secondary mb-4">No questions available</p>
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  if (quizCompleted) {
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-card border border-border rounded-lg p-8 max-w-md" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onClose}
            className="mb-4 flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground-primary"
          >
            <X className="h-4 w-4" />
            Close
          </button>

          <div className="text-center">
            <div className="mb-4 text-6xl">🏆</div>
            <h2 className="mb-4 text-2xl font-bold text-foreground-primary">Quiz Completed!</h2>
            <div className="mb-4 text-4xl font-bold text-primary">
              {score} / {questions.length}
            </div>
            <div className="mb-4 text-2xl text-foreground-secondary">{percentage}%</div>

            {percentage >= 80 ? (
              <p className="mb-4 text-green-500">
                Great job! You're ready to mint your {domain} badge! 🎉
              </p>
            ) : (
              <p className="mb-4 text-foreground-secondary">
                Keep learning! You need 80%+ to mint a badge.
              </p>
            )}

            <button
              onClick={onClose}
              className="rounded-lg bg-primary px-6 py-3 text-white hover:bg-primary/90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg p-6 md:max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground-primary">{domain} Quiz</h2>
            <p className="text-sm text-foreground-secondary">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-foreground-secondary hover:text-foreground-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Warning banner for fallback questions */}
        {error && (
          <div className="mb-4 rounded-lg border border-yellow-500 bg-yellow-500/10 p-3">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              ⚠️ {error} - Start the agent with: <code className="text-xs bg-black/20 px-1 py-0.5 rounded">cd agent && python mailbox_agent.py</code>
            </p>
          </div>
        )}

        {/* Question */}
        <div className="mb-6">
          <p className="text-lg text-foreground-primary">{currentQuestion.question}</p>
        </div>

        {/* Options */}
        <div className="mb-6 space-y-3">
          {currentQuestion.options.map((option, index) => {
            const optionLetter = getOptionLetter(index);
            return (
              <button
                key={index}
                className={`w-full rounded-lg border p-4 text-left transition-all ${
                  getOptionClass(optionLetter) === 'selected'
                    ? 'border-primary bg-primary/10'
                    : getOptionClass(optionLetter) === 'correct'
                    ? 'border-green-500 bg-green-500/10'
                    : getOptionClass(optionLetter) === 'incorrect'
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleAnswerSelect(optionLetter)}
                disabled={showExplanation}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-current font-bold">
                    {optionLetter.toUpperCase()}
                  </span>
                  <span className="text-foreground-primary">{option}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div
            className={`mb-6 rounded-lg border p-4 ${
              selectedAnswer === currentQuestion.correct
                ? 'border-green-500 bg-green-500/10'
                : 'border-red-500 bg-red-500/10'
            }`}
          >
            <div className="mb-2 font-bold">
              {selectedAnswer === currentQuestion.correct ? '✅ Correct!' : '❌ Incorrect'}
            </div>
            <p className="text-foreground-primary">{currentQuestion.explanation}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3">
          {!showExplanation ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer}
              className="rounded-lg bg-primary px-6 py-3 text-white disabled:opacity-50 hover:bg-primary/90"
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="rounded-lg bg-primary px-6 py-3 text-white hover:bg-primary/90"
            >
              {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

