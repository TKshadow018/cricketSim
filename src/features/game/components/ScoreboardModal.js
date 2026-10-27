import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

function ScoreboardModal({
  children,
  onClose,
  title = 'Full Scoreboard',
  kicker = 'MATCH DATA',
  closeLabel = 'Close Scoreboard',
  scrollHint = 'Swipe horizontally to view all columns.',
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="sim-confirm-overlay sim-scoreboard-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <section
        className="sim-confirm-modal sim-scoreboard-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="full-scoreboard-title"
      >
        <header className="sim-scoreboard-modal-header">
          <div>
            <p className="sim-card-kicker">{kicker}</p>
            <h2 id="full-scoreboard-title">{title}</h2>
          </div>
          <button
            type="button"
            className="sim-modal-top-close"
            aria-label={closeLabel}
            autoFocus
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </header>
        <div className="sim-scoreboard-modal-content">
          {scrollHint ? <p className="sim-scoreboard-scroll-hint">{scrollHint}</p> : null}
          {children}
        </div>
      </section>
    </div>,
    document.body
  );
}

export default ScoreboardModal;
