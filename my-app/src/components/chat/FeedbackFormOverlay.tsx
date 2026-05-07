'use client'

import { FiStar, FiX } from 'react-icons/fi'

interface FeedbackFormOverlayProps {
  open: boolean
  title?: string
  description?: string
  rating: number
  text: string
  submitting?: boolean
  onRatingChange: (rating: number) => void
  onTextChange: (text: string) => void
  onSubmit: () => void
  onClose: () => void
}

export default function FeedbackFormOverlay({
  open,
  title = 'Leave feedback',
  description = 'Tell us what you think and give us a star rating.',
  rating,
  text,
  submitting = false,
  onRatingChange,
  onTextChange,
  onSubmit,
  onClose,
}: FeedbackFormOverlayProps) {
  if (!open) return null

  return (
    <div className="widget-feedback-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="widget-feedback-card">
        <div className="widget-feedback-header">
          <div>
            <h4>{title}</h4>
            <p>{description}</p>
          </div>
          <button type="button" className="widget-feedback-close" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>

        <div className="widget-feedback-rating" aria-label="Rating selector">
          {Array.from({ length: 5 }, (_, index) => {
            const value = index + 1
            return (
              <button
                key={value}
                type="button"
                className={`widget-feedback-star ${value <= rating ? 'is-active' : ''}`}
                onClick={() => onRatingChange(value)}
                aria-label={`${value} star${value === 1 ? '' : 's'}`}
              >
                <FiStar />
              </button>
            )
          })}
        </div>

        <label className="widget-feedback-field">
          <span>Your feedback</span>
          <textarea
            id="widget-feedback-text"
            name="widget-feedback-text"
            value={text}
            onChange={(event) => onTextChange(event.target.value)}
            rows={5}
            placeholder="What went well, and what could be better?"
          />
        </label>

        <div className="widget-feedback-actions">
          <button type="button" className="widget-feedback-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className="widget-feedback-primary"
            onClick={onSubmit}
            disabled={submitting || rating < 1 || !text.trim()}
          >
            {submitting ? 'Submitting...' : 'Submit feedback'}
          </button>
        </div>
      </div>
    </div>
  )
}
