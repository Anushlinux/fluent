'use client';

/**
 * ToastNotification Component
 * Displays real-time nudges and insights from the knowledge graph
 */

import React, { useEffect, useState } from 'react';
import './ToastNotification.css';

export interface ToastData {
  id: string;
  type: 'gap_detected' | 'quiz_suggested' | 'milestone_reached' | 'info';
  title: string;
  message: string;
  actions?: {
    label: string;
    onClick: () => void;
  }[];
  duration?: number; // Auto-dismiss after ms (default 8000)
}

interface ToastNotificationProps {
  toast: ToastData;
  onDismiss: () => void;
}

export function ToastNotification({ toast, onDismiss }: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Entrance animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss
    const duration = toast.duration || 8000;
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 300); // Match exit animation duration
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'gap_detected':
        return '💡';
      case 'quiz_suggested':
        return '📝';
      case 'milestone_reached':
        return '🏆';
      default:
        return 'ℹ️';
    }
  };

  const getTypeClass = () => {
    switch (toast.type) {
      case 'gap_detected':
        return 'toast--warning';
      case 'quiz_suggested':
        return 'toast--info';
      case 'milestone_reached':
        return 'toast--success';
      default:
        return 'toast--info';
    }
  };

  return (
    <div
      className={`toast ${getTypeClass()} ${isVisible ? 'toast--visible' : ''} ${
        isExiting ? 'toast--exiting' : ''
      }`}
    >
      <div className="toast__icon">{getIcon()}</div>

      <div className="toast__content">
        <div className="toast__title">{toast.title}</div>
        <div className="toast__message">{toast.message}</div>

        {toast.actions && toast.actions.length > 0 && (
          <div className="toast__actions">
            {toast.actions.map((action, index) => (
              <button
                key={index}
                className="toast__action-button"
                onClick={() => {
                  action.onClick();
                  handleDismiss();
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button className="toast__close" onClick={handleDismiss} aria-label="Close notification">
        ×
      </button>
    </div>
  );
}

/**
 * ToastContainer Component
 * Manages multiple toasts
 */

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastNotification key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}

