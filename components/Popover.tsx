import React, { useState } from 'react';
import './Popover.css';

export interface Quiz {
  question: string;
  answers: string[];
  correct: number;
  hint?: string;
}

export interface CapturedSentence {
  id: string;
  sentence: string;
  terms: string[];
  context: string;
  timestamp: string;
}

export interface PopoverProps {
  term: string;
  definition: string;
  usage: string;
  quiz: Quiz;
  position: { x: number; y: number };
  mode: 'preview' | 'full';
  captureCandidateSentence?: string | null;
  latestCapturedSentence?: CapturedSentence | null;
  onCaptureSentence?: () => Promise<void> | void;
  onQuizAnswer?: (correct: boolean) => void;
  onClose?: () => void;
}

export const Popover: React.FC<PopoverProps> = ({
  term,
  definition,
  usage,
  quiz,
  position,
  mode,
  captureCandidateSentence,
  latestCapturedSentence,
  onCaptureSentence,
  onQuizAnswer,
  onClose,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);

  const [isCapturing, setIsCapturing] = useState(false);

  const handleAnswerSelect = (index: number) => {
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;

    const correct = selectedAnswer === quiz.correct;
    setShowFeedback(true);
    
    if (correct) {
      setFeedback({
        correct: true,
        message: '🎉 Correct! +10 XP',
      });
    } else {
      setFeedback({
        correct: false,
        message: quiz.hint ? `❌ Incorrect. Hint: ${quiz.hint}` : '❌ Incorrect. Try again!',
      });
    }

    onQuizAnswer?.(correct);
  };

  const handleCaptureSentence = async () => {
    if (!onCaptureSentence || isCapturing) {
      return;
    }

    try {
      setIsCapturing(true);
      await onCaptureSentence();
    } finally {
      setIsCapturing(false);
    }
  };

  // Calculate position to ensure popover stays within viewport
  const style: React.CSSProperties = {
    position: 'fixed',
    left: `${Math.min(position.x, window.innerWidth - 320)}px`,
    top: `${Math.min(position.y + 10, window.innerHeight - 400)}px`,
    zIndex: 2147483647, // Maximum z-index
  };

  return (
    <div className={`fluent-popover fluent-popover--${mode}`} style={style}>
      <div className="fluent-popover__header">
        <h3 className="fluent-popover__term">{term}</h3>
        {onClose && (
          <button 
            className="fluent-popover__close" 
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>

      <div className="fluent-popover__content">
        <div className="fluent-popover__definition">
          <strong>Definition:</strong>
          <p>{definition}</p>
        </div>

        {captureCandidateSentence && (
          <div className="fluent-popover__capture">
            <strong>Capture this sentence:</strong>
            <p className="fluent-popover__capture-text">
              {captureCandidateSentence.length > 180
                ? `${captureCandidateSentence.slice(0, 177)}…`
                : captureCandidateSentence}
            </p>
            <button
              className="fluent-popover__capture-button"
              onClick={handleCaptureSentence}
              disabled={isCapturing}
            >
              {isCapturing ? 'Capturing…' : 'Capture Sentence'}
            </button>
          </div>
        )}

        {latestCapturedSentence && (
          <div className="fluent-popover__captured-meta">
            <strong>Last captured:</strong>
            <p className="fluent-popover__captured-text">
              <em>
                {latestCapturedSentence.sentence.length > 140
                  ? `${latestCapturedSentence.sentence.slice(0, 137)}…`
                  : latestCapturedSentence.sentence}
              </em>
            </p>
          </div>
        )}

        {mode === 'full' && (
          <>
            <div className="fluent-popover__usage">
              <strong>Example:</strong>
              <p><em>{usage}</em></p>
            </div>

            <div className="fluent-popover__quiz">
              <strong>Test your knowledge:</strong>
              <p className="fluent-popover__question">{quiz.question}</p>
              
              <div className="fluent-popover__answers">
                {quiz.answers.map((answer, index) => (
                  <label 
                    key={index} 
                    className={`fluent-popover__answer ${
                      selectedAnswer === index ? 'fluent-popover__answer--selected' : ''
                    } ${
                      showFeedback && index === quiz.correct ? 'fluent-popover__answer--correct' : ''
                    } ${
                      showFeedback && selectedAnswer === index && index !== quiz.correct 
                        ? 'fluent-popover__answer--incorrect' 
                        : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="quiz-answer"
                      value={index}
                      checked={selectedAnswer === index}
                      onChange={() => handleAnswerSelect(index)}
                      disabled={showFeedback}
                    />
                    <span>{answer}</span>
                  </label>
                ))}
              </div>

              {!showFeedback && (
                <button
                  className="fluent-popover__submit"
                  onClick={handleSubmit}
                  disabled={selectedAnswer === null}
                >
                  Submit Answer
                </button>
              )}

              {showFeedback && feedback && (
                <div className={`fluent-popover__feedback fluent-popover__feedback--${
                  feedback.correct ? 'correct' : 'incorrect'
                }`}>
                  {feedback.message}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {mode === 'preview' && (
        <div className="fluent-popover__hint">
          Click the term to take a quiz and earn XP
        </div>
      )}
    </div>
  );
};

