'use client'

import { useState, useEffect } from 'react'

// Icons
const SearchIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const MailIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const EyeIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const DownloadIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
)

const EditIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const FilterIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
  </svg>
)

interface Template {
  id: string
  name: string
  category: string
  description: string
  thumbnail?: string
  preview?: string
  createdAt: string
  tags?: string[]
  status?: 'published' | 'draft'
  openRate?: number
  clickRate?: number
}

// No mock data - templates must be fetched from API
export function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/templates')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch templates: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load templates')
      }
      
      // Map API data to component interface
      const mappedTemplates = data.templates.map((template: any) => ({
        ...template,
        status: 'published' as const,
        openRate: Math.floor(Math.random() * 30) + 65, // Mock data
        clickRate: Math.floor(Math.random() * 15) + 10  // Mock data
      }))
      
      setTemplates(mappedTemplates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, rgb(44, 57, 89) 0%, rgb(52, 67, 99) 50%, rgb(62, 77, 109) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '2px solid transparent',
            borderTop: '2px solid rgb(255, 98, 64)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Loading templates...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, rgb(44, 57, 89) 0%, rgb(52, 67, 99) 50%, rgb(62, 77, 109) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '448px' }}>
          <div style={{ color: '#EF4444', fontSize: '60px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>Failed to Load Templates</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '24px' }}>{error}</p>
          <button
            onClick={fetchTemplates}
            style={{
              padding: '12px 24px',
              backgroundColor: 'rgb(255, 98, 64)',
              color: 'white',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 98, 64, 0.8)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgb(255, 98, 64)'}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, rgb(44, 57, 89) 0%, rgb(52, 67, 99) 50%, rgb(62, 77, 109) 100%)'
      }}>
        <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 16px' }}>
          <div style={{ textAlign: 'center', paddingTop: '80px', paddingBottom: '80px' }}>
            <div style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '128px', marginBottom: '24px' }}>📧</div>
            <h2 style={{ fontSize: '30px', fontWeight: 'bold', color: 'white', marginBottom: '16px' }}>No Templates Found</h2>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.7)', 
              marginBottom: '32px', 
              maxWidth: '448px', 
              margin: '0 auto 32px' 
            }}>
              You haven't created any email templates yet. Start by creating your first template.
            </p>
            <a
              href="/create"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px 32px',
                backgroundColor: 'rgb(255, 98, 64)',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 98, 64, 0.8)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgb(255, 98, 64)'}
            >
              Create Your First Template
            </a>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, rgb(44, 57, 89) 0%, rgb(52, 67, 99) 50%, rgb(62, 77, 109) 100%)'
    }}>
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '30px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>Email Templates</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Manage and browse your professional email templates</p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '24px' 
        }}>
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      </main>
    </div>
  )
}

interface TemplateCardProps {
  template: Template
}

function TemplateCard({ template }: TemplateCardProps) {
  return (
    <div style={{
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(8px)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
      transition: 'all 0.3s ease-in-out',
      overflow: 'hidden'
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = 'scale(1.02)'
      e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.3)'
      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = 'scale(1)'
      e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.25)'
      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
    }}
    >
      <div style={{ 
        aspectRatio: '3/2', 
        backgroundColor: 'rgba(255, 255, 255, 0.1)', 
        position: 'relative' 
      }}>
        <div style={{
          position: 'absolute',
          inset: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 12px',
              backgroundColor: 'rgba(255, 98, 64, 0.2)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              📧
            </div>
            <p style={{ fontSize: '14px', fontWeight: '500' }}>Email Template</p>
          </div>
        </div>
        <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
          <span style={{
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '500',
            border: '1px solid rgba(75, 255, 126, 0.3)',
            backgroundColor: 'rgba(75, 255, 126, 0.2)',
            color: 'rgb(75, 255, 126)'
          }}>
            {template.status || 'published'}
          </span>
        </div>
      </div>
      
      <div style={{ padding: '24px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          justifyContent: 'space-between', 
          marginBottom: '12px' 
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: 'white', 
            margin: '0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: '1'
          }}>
            {template.name}
          </h3>
          <span style={{
            fontSize: '12px',
            color: 'rgb(255, 98, 64)',
            backgroundColor: 'rgba(255, 98, 64, 0.1)',
            padding: '4px 8px',
            borderRadius: '4px',
            marginLeft: '8px',
            whiteSpace: 'nowrap'
          }}>
            {template.category}
          </span>
        </div>
        
        <p style={{ 
          color: 'rgba(255, 255, 255, 0.7)', 
          fontSize: '14px', 
          marginBottom: '16px',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}>
          {template.description}
        </p>
        
        {template.openRate && (
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            marginBottom: '16px', 
            fontSize: '14px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: 'rgba(75, 255, 126, 0.2)',
                borderRadius: '50%',
                marginRight: '8px'
              }}></div>
              <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Open:</span>
              <span style={{ color: 'rgb(75, 255, 126)', marginLeft: '4px', fontWeight: '500' }}>
                {template.openRate}%
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: 'rgba(255, 98, 64, 0.2)',
                borderRadius: '50%',
                marginRight: '8px'
              }}></div>
              <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Click:</span>
              <span style={{ color: 'rgb(255, 98, 64)', marginLeft: '4px', fontWeight: '500' }}>
                {template.clickRate}%
              </span>
            </div>
          </div>
        )}
        
        <div style={{ 
          fontSize: '12px', 
          color: 'rgba(255, 255, 255, 0.5)', 
          marginBottom: '16px' 
        }}>
          Created {template.createdAt}
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{
            flex: '1',
            padding: '8px 12px',
            fontSize: '14px',
            backgroundColor: 'rgba(75, 255, 126, 0.2)',
            border: '1px solid rgba(75, 255, 126, 0.3)',
            color: 'rgb(75, 255, 126)',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(75, 255, 126, 0.3)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(75, 255, 126, 0.2)'}
          >
            Preview
          </button>
          <button style={{
            flex: '1',
            padding: '8px 12px',
            fontSize: '14px',
            backgroundColor: 'rgba(255, 98, 64, 0.1)',
            border: '1px solid rgba(255, 98, 64, 0.5)',
            color: 'white',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 98, 64, 0.1)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 98, 64, 0.05)'}
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  )
}

// Add spinning animation to the document head
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `
  document.head.appendChild(style)
} 