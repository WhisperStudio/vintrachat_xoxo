'use client'

import { FiChevronDown, FiChevronUp } from 'react-icons/fi'
import type { InputsState } from '../types'
import './ComplexitySettings.css'

interface ComplexitySettingsProps {
  inputs: Pick<InputsState, 'ecommerce' | 'ecommerceLevel' | 'admin' | 'adminLevel' | 'database' | 'databaseLevel' | 'gallery' | 'galleryLevel' | 'viewer3D' | 'viewer3DLevel'>
  isOpen: boolean
  onToggle: () => void
  onInputChange: (key: keyof InputsState, value: number) => void
  formatCurrency: (amount: number) => string
  dyn: (min: number, max: number, level: number) => number
  priceMap: {
    ecommerce: { min: number; max: number }
    admin: { min: number; max: number }
    database: { min: number; max: number }
    gallery: { min: number; max: number }
    viewer3D: { min: number; max: number }
  }
}

export default function ComplexitySettings({
  inputs,
  isOpen,
  onToggle,
  onInputChange,
  formatCurrency,
  dyn,
  priceMap
}: ComplexitySettingsProps) {
  return (
    <div className="complexity-group group">
      <button
        type="button"
        className={`dropbtn ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
      >
        <span className="label">Complexity settings</span>
        <span className="dropbtn-icon">
          {isOpen ? <FiChevronUp /> : <FiChevronDown />}
        </span>
      </button>

      <div className={`dropdown-content block ${isOpen ? 'open' : ''}`}>
        {inputs.ecommerce && (
          <div className="mini-group">
            <label className="label">
              E-commerce complexity
              <span className="value">
                {formatCurrency(
                  dyn(priceMap.ecommerce.min, priceMap.ecommerce.max, inputs.ecommerceLevel)
                )}
              </span>
            </label>
            <input
              className="slider"
              type="range"
              min="1"
              max="10"
              value={inputs.ecommerceLevel}
              onChange={(e) =>
                onInputChange('ecommerceLevel', parseInt(e.target.value, 10))
              }
            />
            <div className="scale-row">
              <span>Basic</span>
              <span>Advanced</span>
            </div>
          </div>
        )}

        {inputs.admin && (
          <div className="mini-group">
            <label className="label">
              Admin panel complexity
              <span className="value">
                {formatCurrency(dyn(priceMap.admin.min, priceMap.admin.max, inputs.adminLevel))}
              </span>
            </label>
            <input
              className="slider"
              type="range"
              min="1"
              max="10"
              value={inputs.adminLevel}
              onChange={(e) => onInputChange('adminLevel', parseInt(e.target.value, 10))}
            />
            <div className="scale-row">
              <span>Basic</span>
              <span>Advanced</span>
            </div>
          </div>
        )}

        {inputs.database && !inputs.ecommerce && (
          <div className="mini-group">
            <label className="label">
              Database complexity
              <span className="value">
                {formatCurrency(
                  dyn(priceMap.database.min, priceMap.database.max, inputs.databaseLevel)
                )}
              </span>
            </label>
            <input
              className="slider"
              type="range"
              min="1"
              max="10"
              value={inputs.databaseLevel}
              onChange={(e) =>
                onInputChange('databaseLevel', parseInt(e.target.value, 10))
              }
            />
            <div className="scale-row">
              <span>Basic</span>
              <span>Advanced</span>
            </div>
          </div>
        )}

        {inputs.gallery && (
          <div className="mini-group">
            <label className="label">
              Gallery complexity
              <span className="value">
                {formatCurrency(
                  dyn(priceMap.gallery.min, priceMap.gallery.max, inputs.galleryLevel)
                )}
              </span>
            </label>
            <input
              className="slider"
              type="range"
              min="1"
              max="10"
              value={inputs.galleryLevel}
              onChange={(e) =>
                onInputChange('galleryLevel', parseInt(e.target.value, 10))
              }
            />
            <div className="scale-row">
              <span>Basic</span>
              <span>Advanced</span>
            </div>
          </div>
        )}

        {inputs.viewer3D && (
          <div className="mini-group">
            <label className="label">
              3D viewer complexity
              <span className="value">
                {formatCurrency(
                  dyn(priceMap.viewer3D.min, priceMap.viewer3D.max, inputs.viewer3DLevel)
                )}
              </span>
            </label>
            <input
              className="slider"
              type="range"
              min="1"
              max="10"
              value={inputs.viewer3DLevel}
              onChange={(e) =>
                onInputChange('viewer3DLevel', parseInt(e.target.value, 10))
              }
            />
            <div className="scale-row">
              <span>Basic</span>
              <span>Advanced</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
