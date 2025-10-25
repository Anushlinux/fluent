/**
 * QuizModal Component
 * Displays adaptive quizzes to help users strengthen weak knowledge clusters
 */

import React, { useState } from 'react';
import './QuizModal.css';

interface QuizQuestion {
  question: string;
  options: string[];
  correct: string; // 'a', 'b', 'c', or 'd'
  explanation: string;
}

interface QuizModalProps {
  cluster: string;
  difficulty: number;
  questions: QuizQuestion[];
  onClose: () => void;
  onComplete: (score: number, earnedXP: number) => void;
}

export function QuizModal({
  cluster,
  difficulty,
  questions,
  onClose,
  onComplete
}: QuizModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const correctAnswer = currentQuestion?.correct || 'a';

  const handleAnswerSelect = (option: string) => {
    if (showExplanation) return; // Already answered
    setSelectedAnswer(option);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return;

    setShowExplanation(true);

    // Check if correct
    if (selectedAnswer === correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      // Quiz completed
      const finalScore = selectedAnswer === correctAnswer ? score + 1 : score;
      const percentage = (finalScore / questions.length) * 100;
      const earnedXP = Math.round(percentage * 0.1 * difficulty); // Max 30 XP for perfect score at difficulty 3
      
      setScore(finalScore);
      setQuizCompleted(true);
      onComplete(finalScore, earnedXP);
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
    if (!showExplanation) {
      return selectedAnswer === optionLetter ? 'selected' : '';
    }

    if (optionLetter === correctAnswer) {
      return 'correct';
    }

    if (optionLetter === selectedAnswer && optionLetter !== correctAnswer) {
      return 'incorrect';
    }

    return 'faded';
  };

  if (quizCompleted) {
    const percentage = Math.round((score / questions.length) * 100);
    const earnedXP = Math.round(percentage * 0.1 * difficulty);

    return (
      <div className="quiz-modal-overlay" onClick={onClose}>
        <div className="quiz-modal" onClick={(e) => e.stopPropagation()}>
          <button className="quiz-modal__close" onClick={onClose} aria-label="Close quiz">
            ×
          </button>

          <div className="quiz-modal__completion">
            <div className="quiz-modal__trophy">🏆</div>
            <h2>Quiz Completed!</h2>
            <div className="quiz-modal__score">
              {score} / {questions.length} Correct
            </div>
            <div className="quiz-modal__percentage">{percentage}%</div>
            <div className="quiz-modal__xp">
              +{earnedXP} XP Earned!
            </div>
            
            {percentage >= 70 ? (
              <p className="quiz-modal__message success">
                Great job! Your {cluster} cluster is getting stronger! 🎉
              </p>
            ) : percentage >= 40 ? (
              <p className="quiz-modal__message average">
                Good effort! Keep learning about {cluster} to improve. 📚
              </p>
            ) : (
              <p className="quiz-modal__message needs-work">
                This cluster needs more attention. Try capturing more {cluster} content! 💪
              </p>
            )}

            <button className="quiz-modal__button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="quiz-modal-overlay" onClick={onClose}>
        <div className="quiz-modal" onClick={(e) => e.stopPropagation()}>
          <button className="quiz-modal__close" onClick={onClose} aria-label="Close quiz">
            ×
          </button>
          <div className="quiz-modal__error">
            <p>No questions available for this quiz.</p>
            <button className="quiz-modal__button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-modal-overlay" onClick={onClose}>
      <div className="quiz-modal" onClick={(e) => e.stopPropagation()}>
        <button className="quiz-modal__close" onClick={onClose} aria-label="Close quiz">
          ×
        </button>

        <div className="quiz-modal__header">
          <h2>{cluster} Quiz</h2>
          <div className="quiz-modal__progress">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
          <div className="quiz-modal__difficulty">
            Difficulty: {['⭐', '⭐⭐', '⭐⭐⭐'][difficulty - 1] || '⭐'}
          </div>
        </div>

        <div className="quiz-modal__content">
          <div className="quiz-modal__question">
            {currentQuestion.question}
          </div>

          <div className="quiz-modal__options">
            {currentQuestion.options.map((option, index) => {
              const optionLetter = getOptionLetter(index);
              return (
                <button
                  key={index}
                  className={`quiz-modal__option ${getOptionClass(optionLetter)}`}
                  onClick={() => handleAnswerSelect(optionLetter)}
                  disabled={showExplanation}
                >
                  <span className="quiz-modal__option-letter">
                    {optionLetter.toUpperCase()}
                  </span>
                  <span className="quiz-modal__option-text">{option}</span>
                </button>
              );
            })}
          </div>

          {showExplanation && (
            <div className={`quiz-modal__explanation ${selectedAnswer === correctAnswer ? 'correct' : 'incorrect'}`}>
              <div className="quiz-modal__explanation-header">
                {selectedAnswer === correctAnswer ? '✅ Correct!' : '❌ Incorrect'}
              </div>
              <div className="quiz-modal__explanation-text">
                {currentQuestion.explanation}
              </div>
            </div>
          )}
        </div>

        <div className="quiz-modal__footer">
          {!showExplanation ? (
            <button
              className="quiz-modal__button"
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer}
            >
              Submit Answer
            </button>
          ) : (
            <button className="quiz-modal__button" onClick={handleNext}>
              {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
            </button>
          )}
        </div>

        <div className="quiz-modal__score-tracker">
          Current Score: {score} / {currentQuestionIndex}
        </div>
      </div>
    </div>
  );
}

