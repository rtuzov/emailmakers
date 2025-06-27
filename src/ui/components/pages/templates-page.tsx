'use client'

import React, { useState } from 'react'
import { GlassCard, GlassButton, GlassInput } from '../glass'

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
  thumbnail: string
  createdAt: string
  status: 'draft' | 'published'
  openRate?: number
  clickRate?: number
}

const mockTemplates: Template[] = [
  {
    id: '1',
    name: 'Welcome Email Series',
    category: 'Onboarding',
    description: 'A beautiful welcome email template for new subscribers with personalized greeting and company introduction',
    thumbnail: '',
    createdAt: 'January 27, 2025',
    status: 'published',
    openRate: 85.2,
    clickRate: 12.4
  },
  {
    id: '2',
    name: 'Product Launch Announcement',
    category: 'Marketing',
    description: 'Eye-catching template for product launches and announcements with compelling visuals and clear CTAs',
    thumbnail: '',
    createdAt: 'January 26, 2025',
    status: 'published',
    openRate: 78.9,
    clickRate: 15.6
  },
  {
    id: '3',
    name: 'Monthly Newsletter',
    category: 'Newsletter',
    description: 'Clean and professional monthly newsletter template featuring company updates, industry news, and insights',
    thumbnail: '',
    createdAt: 'January 25, 2025',
    status: 'draft'
  },
  {
    id: '4',
    name: 'Promotional Campaign',
    category: 'Sales',
    description: 'High-converting promotional email template with discount codes, urgency elements, and social proof',
    thumbnail: '',
    createdAt: 'January 24, 2025',
    status: 'published',
    openRate: 92.1,
    clickRate: 18.3
  },
  {
    id: '5',
    name: 'Customer Feedback Survey',
    category: 'Marketing',
    description: 'Engaging survey email template to collect customer feedback with incentive offers',
    thumbnail: '',
    createdAt: 'January 23, 2025',
    status: 'published',
    openRate: 67.8,
    clickRate: 8.9
  },
  {
    id: '6',
    name: 'Event Invitation',
    category: 'Marketing',
    description: 'Professional event invitation template with RSVP functionality and event details',
    thumbnail: '',
    createdAt: 'January 22, 2025',
    status: 'draft'
  }
]

interface TemplateCardProps {
  template: Template
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template }) => {
  const handlePreview = () => {
    console.log('Preview template:', template.id)
    // TODO: Implement preview modal
  }

  const handleEdit = () => {
    console.log('Edit template:', template.id)
    // TODO: Navigate to edit page
  }

  const handleDownload = () => {
    console.log('Download template:', template.id)
    // TODO: Implement download functionality
  }

  return (
    <GlassCard hover className="overflow-hidden">
      {/* Template Preview */}
      <div className="aspect-[3/2] bg-background-light relative">
        <div className="absolute inset-0 flex items-center justify-center text-white/60">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2">
              <MailIcon />
            </div>
            <p className="text-xs">Email Template</p>
          </div>
        </div>
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            template.status === 'published' 
              ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/30' 
              : 'bg-brand-warning/20 text-brand-warning border border-brand-warning/30'
          }`}>
            {template.status}
          </span>
        </div>
      </div>
      
      {/* Template Info */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-white truncate">{template.name}</h3>
          <span className="text-xs text-white/60 bg-glass-secondary px-2 py-1 rounded">
            {template.category}
          </span>
        </div>
        
        <p className="text-white/70 text-sm mb-4 line-clamp-2">{template.description}</p>
        
        {/* Metrics */}
        {template.openRate && (
          <div className="flex gap-4 mb-4 text-sm">
            <div>
              <span className="text-white/60">Open Rate:</span>
              <span className="text-brand-accent ml-1 font-medium">{template.openRate}%</span>
            </div>
            <div>
              <span className="text-white/60">Click Rate:</span>
              <span className="text-brand-accent ml-1 font-medium">{template.clickRate}%</span>
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-2">
          <GlassButton 
            variant="ghost" 
            size="sm" 
            className="flex-1"
            onClick={handlePreview}
          >
            <EyeIcon />
            Preview
          </GlassButton>
          <GlassButton 
            variant="ghost" 
            size="sm"
            onClick={handleEdit}
          >
            <EditIcon />
          </GlassButton>
          <GlassButton 
            variant="ghost" 
            size="sm"
            onClick={handleDownload}
          >
            <DownloadIcon />
          </GlassButton>
        </div>
        
        <div className="mt-3 text-xs text-white/50">
          Created {template.createdAt}
        </div>
      </div>
    </GlassCard>
  )
}

export const TemplatesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  const categories = ['all', 'onboarding', 'marketing', 'newsletter', 'sales']
  
  const filteredTemplates = mockTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || 
                           template.category.toLowerCase() === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Email Templates</h1>
        <p className="text-white/70">
          Manage and create beautiful email templates with AI-powered generation
        </p>
      </div>

      {/* Controls */}
      <GlassCard className="p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <GlassInput
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<SearchIcon />}
              className="md:max-w-xs"
            />
            
            <div className="flex gap-2">
              <GlassButton
                variant="ghost"
                size="sm"
                leftIcon={<FilterIcon />}
              >
                Filter
              </GlassButton>
              
              {categories.map(category => (
                <GlassButton
                  key={category}
                  variant={selectedCategory === category ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </GlassButton>
              ))}
            </div>
          </div>
          
          <GlassButton 
            variant="primary"
            onClick={() => window.location.href = '/create'}
          >
            Create New Template
          </GlassButton>
        </div>
      </GlassCard>

      {/* Templates Grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTemplates.map(template => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      ) : (
        <GlassCard className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-white/40">
            <MailIcon />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No templates found</h3>
          <p className="text-white/70 mb-6">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by creating your first email template'
            }
          </p>
          <GlassButton 
            variant="primary"
            onClick={() => window.location.href = '/create'}
          >
            Create Your First Template
          </GlassButton>
        </GlassCard>
      )}
    </div>
  )
} 