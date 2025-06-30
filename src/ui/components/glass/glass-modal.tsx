'use client'

import React, { useEffect } from 'react'
import { cn } from '@/shared/utils/cn'

export interface GlassModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  blur?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnOverlayClick?: boolean
  showCloseButton?: boolean
  children: React.ReactNode
  className?: string
}

const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  blur = 'xl',
  closeOnOverlayClick = true,
  showCloseButton = true,
  children,
  className,
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  }

  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-black/50',
        blurClasses[blur]
      )}
      onClick={handleOverlayClick}
    >
      {/* Modal Content */}
      <div
        className={cn(
          'glass-modal w-full animate-fade-in-scale',
          sizeClasses[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              {title && (
                <h2 className="text-xl font-semibold text-white font-primary">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-white/70">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="glass-button p-2 text-white/70 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

GlassModal.displayName = 'GlassModal'

export { GlassModal } 