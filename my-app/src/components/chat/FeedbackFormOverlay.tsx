'use client'

import type { ReactNode, CSSProperties } from 'react'
import type { WidgetPageDesign } from '@/types/database'
import { getWidgetPageStyle } from '@/lib/widget-flow.mjs'
import { FiStar } from 'react-icons/fi'

interface FeedbackFormOverlayProps {
  design?: WidgetPageDesign
  icon?: ReactNode
  submitLabel?: string
  placeholder?: string
  translate?: (text: string) => string
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
  translate: t = (text: string) => text,
  design, icon, submitLabel, placeholder,
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
    <div className="widget-feedback-overlay widget-page-design" style={getWidgetPageStyle(design) as CSSProperties} role="region" aria-label={title}>
      <div className="widget-feedback-card">
        <div className="widget-feedback-header">
          <div>
            <div className="widget-page-heading">{icon}<h4>{title}</h4></div>
            <p>{description}</p>
          </div>
        </div>

        <div className="widget-feedback-rating" aria-label={t("Rating selector")}>
          {Array.from({ length: 5 }, (_, index) => {
            const value = index + 1
            return (
              <button
                key={value}
                type="button"
                className={`widget-feedback-star ${value <= rating ? 'is-active' : ''}`}
                onClick={() => onRatingChange(value)}
                aria-label={`${value} ${t('stars')}`}
              >
                <FiStar />
              </button>
            )
          })}
        </div>

        <label className="widget-feedback-field">
          <span>{t("Your feedback")}</span>
          <textarea
            id="widget-feedback-text"
            name="widget-feedback-text"
            value={text}
            onChange={(event) => onTextChange(event.target.value)}
            rows={5}
            placeholder={t(placeholder || 'What went well, and what could be better?')}
          />
        </label>

        <div className="widget-feedback-actions">
          <button type="button" className="widget-feedback-secondary" onClick={onClose} disabled={submitting}>
            {t('Cancel')}
          </button>
          <button
            type="button"
            className="widget-feedback-primary"
            onClick={onSubmit}
            disabled={submitting || rating < 1 || !text.trim()}
          >
            {submitting ? t('Submitting...') : t(submitLabel || 'Submit feedback')}
          </button>
        </div>
      </div>
    </div>
  )
}
